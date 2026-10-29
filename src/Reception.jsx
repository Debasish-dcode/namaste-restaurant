
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import "./reception.css";

const STATUSES = ["new", "preparing", "ready", "served", "cancelled"];
const ACTIVE_STATUSES = ["new", "preparing", "ready"];

const statusLabels = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
  mixed: "Mixed statuses",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const shortId = (id) => String(id).slice(0, 8).toUpperCase();

export default function Reception() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [staffAllowed, setStaffAllowed] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [closingSessionId, setClosingSessionId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Restore the current Supabase login.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) setLoginError(error.message);

      setSession(data?.session || null);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Verify that the logged-in user is authorized restaurant staff.
  useEffect(() => {
    let cancelled = false;

    if (!session) {
      setStaffAllowed(false);
      setCheckingAccess(false);
      setAccessError("");
      setOrders([]);
      setSessions([]);
      return;
    }

    setCheckingAccess(true);
    setStaffAllowed(false);
    setAccessError("");

    supabase.rpc("is_restaurant_staff").then(({ data, error }) => {
      if (cancelled) return;

      if (error) {
        setAccessError(error.message);
        setStaffAllowed(false);
      } else if (data !== true) {
        setAccessError(
          "This account is not authorized for reception access."
        );
        setStaffAllowed(false);
      } else {
        setStaffAllowed(true);
      }

      setCheckingAccess(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Load active table sessions, their orders, and the saved order items.
  const loadOrders = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);

    setLoadError("");

    try {
      const {
        data: sessionRows,
        error: sessionError,
      } = await supabase
        .from("table_sessions")
        .select("id, table_number, status, opened_at")
        .eq("status", "open")
        .order("opened_at", { ascending: true });

      if (sessionError) throw sessionError;

      const openSessions = sessionRows || [];

      setSessions(openSessions);

      const sessionIds = openSessions.map((item) => item.id);

      if (sessionIds.length === 0) {
        setOrders([]);
        return;
      }

      // Load all order submissions belonging to these open table bills.
      const {
        data: orderRows,
        error: orderError,
      } = await supabase
        .from("orders")
        .select(
          "id, table_session_id, table_number, status, total, customer_note, created_at"
        )
        .in("table_session_id", sessionIds)
        .order("created_at", { ascending: true })
        .limit(1000);

      if (orderError) throw orderError;

      const savedOrders = orderRows || [];
      const orderIds = savedOrders.map((order) => order.id);

      let itemRows = [];

      if (orderIds.length > 0) {
        const {
          data,
          error: itemError,
        } = await supabase
          .from("order_items")
          .select(
            "order_id, item_name, quantity, unit_price, subtotal"
          )
          .in("order_id", orderIds);

        if (itemError) throw itemError;

        itemRows = data || [];
      }

      const itemsByOrder = {};

      itemRows.forEach((item) => {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }

        itemsByOrder[item.order_id].push(item);
      });

      setOrders(
        savedOrders.map((order) => ({
          ...order,
          items: itemsByOrder[order.id] || [],
        }))
      );
    } catch (err) {
      console.error("Reception table-bill loading failed:", err);

      setLoadError(
        err instanceof Error
          ? err.message
          : "Could not load table bills."
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh the dashboard automatically every 15 seconds.
  useEffect(() => {
    if (!session || !staffAllowed) return;

    loadOrders();

    const timer = window.setInterval(() => {
      loadOrders(true);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [session, staffAllowed, loadOrders]);

  // Combine all orders for each table's current open session.
  const tableGroups = useMemo(() => {
    const sessionsByTable = new Map(
      sessions.map((tableSession) => [
        Number(tableSession.table_number),
        tableSession,
      ])
    );

    const groups = Array.from({ length: 10 }, (_, index) => {
      const tableNumber = index + 1;
      const tableSession =
        sessionsByTable.get(tableNumber) || null;

      return {
        tableNumber,
        sessionId: tableSession?.id || null,
        sessionOpenedAt: tableSession?.opened_at || null,
        orders: [],
        itemsByKey: new Map(),
        items: [],
        total: 0,
        itemCount: 0,
        notes: [],
        statuses: [],
        summaryStatus: "empty",
        firstOrderAt: null,
      };
    });

    orders.forEach((order) => {
      const tableNumber = Number(order.table_number);

      if (
        !Number.isInteger(tableNumber) ||
        tableNumber < 1 ||
        tableNumber > 10
      ) {
        return;
      }

      const group = groups[tableNumber - 1];

      // Do not mix orders from an earlier, already-closed bill.
      if (
        !group.sessionId ||
        order.table_session_id !== group.sessionId
      ) {
        return;
      }

      group.orders.push(order);

      const isCancelled = order.status === "cancelled";

      // Cancelled submissions are excluded from the current bill.
      if (!isCancelled) {
        group.total += Number(order.total) || 0;
        group.statuses.push(order.status);

        if (
          order.customer_note &&
          order.customer_note.trim()
        ) {
          group.notes.push({
            orderId: order.id,
            createdAt: order.created_at,
            note: order.customer_note.trim(),
          });
        }

        (order.items || []).forEach((item) => {
          const unitPrice = Number(item.unit_price) || 0;

          const key =
            `${item.item_name}::${unitPrice.toFixed(2)}`;

          const existing = group.itemsByKey.get(key);

          if (existing) {
            existing.quantity += Number(item.quantity) || 0;
            existing.subtotal += Number(item.subtotal) || 0;
          } else {
            group.itemsByKey.set(key, {
              item_name: item.item_name,
              unit_price: unitPrice,
              quantity: Number(item.quantity) || 0,
              subtotal: Number(item.subtotal) || 0,
            });
          }
        });
      }

      if (
        !group.firstOrderAt ||
        new Date(order.created_at) <
          new Date(group.firstOrderAt)
      ) {
        group.firstOrderAt = order.created_at;
      }
    });

    return groups.map((group) => {
      const items = Array.from(
        group.itemsByKey.values()
      ).sort((a, b) =>
        a.item_name.localeCompare(b.item_name)
      );

      const uniqueStatuses = [
        ...new Set(group.statuses),
      ];

      const allCancelled =
        group.orders.length > 0 &&
        group.orders.every(
          (order) => order.status === "cancelled"
        );

      return {
        ...group,
        items,
        itemsByKey: undefined,
        itemCount: items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        summaryStatus:
          uniqueStatuses.length === 0
            ? allCancelled
              ? "cancelled"
              : "empty"
            : uniqueStatuses.length === 1
              ? uniqueStatuses[0]
              : "mixed",
        statuses: uniqueStatuses,
      };
    });
  }, [orders, sessions]);

  const counts = useMemo(
    () => ({
      new: orders.filter(
        (order) => order.status === "new"
      ).length,

      preparing: orders.filter(
        (order) => order.status === "preparing"
      ).length,

      ready: orders.filter(
        (order) => order.status === "ready"
      ).length,

      tables: sessions.length,
      totalOrders: orders.length,
    }),
    [orders, sessions]
  );

  
  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tableGroups
      .filter((group) => {
        const statusMatches =
          filter === "all" ||
          group.orders.some(
            (order) => order.status === filter
          );

        const searchable = [
          `table ${group.tableNumber}`,
          group.tableNumber,
          ...group.orders.map((order) => order.id),
          ...group.notes.map((note) => note.note),
          ...group.items.map((item) => item.item_name),
        ]
          .join(" ")
          .toLowerCase();

        return (
          statusMatches &&
          (!term || searchable.includes(term))
        );
      })
      .sort((a, b) => {
        const latestOrderTime = (group) => {
          if (!group.orders.length) return 0;

          return Math.max(
            ...group.orders.map((order) => {
              const time = new Date(order.created_at).getTime();
              return Number.isFinite(time) ? time : 0;
            })
          );
        };

        return latestOrderTime(b) - latestOrderTime(a);
      });
  }, [tableGroups, filter, search]);


  // Staff login.
  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginError("");
    setLoggingIn(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) throw error;

      setSession(data.session);
      setPassword("");
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : "Could not sign in."
      );
    } finally {
      setLoggingIn(false);
    }
  };

  // Staff logout.
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoginError(error.message);
      return;
    }

    setSession(null);
    setStaffAllowed(false);
    setOrders([]);
    setSessions([]);
  };

  // Update the kitchen status of an individual order submission.
  const changeStatus = async (order, nextStatus) => {
    if (updatingOrderId) return;

    setUpdatingOrderId(order.id);
    setLoadError("");
    setNotice("");

    try {
      const { error } = await supabase.rpc(
        "update_dine_in_order_status",
        {
          p_order_id: order.id,
          p_status: nextStatus,
        }
      );

      if (error) throw error;

      setNotice(
        `Order ${shortId(order.id)} for Table ${order.table_number} updated.`
      );

      await loadOrders(true);
    } catch (err) {
      console.error("Order status update failed:", err);

      setLoadError(
        err instanceof Error
          ? err.message
          : "Could not update order."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Close a table's current bill only after staff confirms payment.
  const closeBill = async (group) => {
    if (!group.sessionId || closingSessionId) return;

    const confirmed = window.confirm(
      `Confirm that payment of ${money(group.total)} has been received for Table ${group.tableNumber}?\n\n` +
        "This closes the current bill. The next customer order for this table will automatically start a new bill."
    );

    if (!confirmed) return;

    setClosingSessionId(group.sessionId);
    setLoadError("");
    setNotice("");

    try {
      const { error } = await supabase.rpc(
        "pay_and_close_table_session",
        {
          p_table_session_id: group.sessionId,
        }
      );

      if (error) throw error;

      setNotice(
        `Table ${group.tableNumber} bill closed. The next order will start a new bill.`
      );

      await loadOrders(true);
    } catch (err) {
      console.error("Could not close table bill:", err);

      setLoadError(
        err instanceof Error
          ? err.message
          : "Could not close this bill."
      );
    } finally {
      setClosingSessionId(null);
    }
  };

  // Initial loading screen.
  if (initializing) {
    return (
      <div className="reception-loading">
        <div className="reception-spinner" />
        <p>Opening reception...</p>
      </div>
    );
  }

  // Login screen.
  if (!session) {
    return (
      <main className="reception-login-page">
        <section className="reception-login-card">
          <div className="reception-brand-mark">N</div>

          <p className="reception-eyebrow">
            NAMASTE RESTAURANT
          </p>

          <h1>Welcome to reception</h1>

          <p className="reception-muted">
            Sign in with your authorized staff account to
            manage incoming dine-in orders.
          </p>

          <form
            className="reception-login-form"
            onSubmit={handleLogin}
          >
            <label htmlFor="reception-email">
              Email address
            </label>

            <input
              id="reception-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="reception@example.com"
              required
            />

            <label htmlFor="reception-password">
              Password
            </label>

            <input
              id="reception-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
            />

            {loginError && (
              <p className="reception-error">
                {loginError}
              </p>
            )}

            <button
              className="reception-primary-button"
              type="submit"
              disabled={loggingIn}
            >
              {loggingIn
                ? "Signing in..."
                : "Sign in securely"}
            </button>
          </form>

          <p className="reception-login-foot">
            Authorized restaurant staff only
          </p>
        </section>
      </main>
    );
  }

  // Staff access verification screen.
  if (checkingAccess) {
    return (
      <div className="reception-loading">
        <div className="reception-spinner" />
        <p>Checking reception access...</p>
      </div>
    );
  }

  // Unauthorized accounts cannot access the dashboard.
  if (!staffAllowed) {
    return (
      <div className="reception-loading">
        <section className="reception-login-card">
          <div className="reception-brand-mark">!</div>

          <h1>Reception access denied</h1>

          <p className="reception-error">
            {accessError ||
              "This account is not authorized."}
          </p>

          <button
            className="reception-secondary-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </section>
      </div>
    );
  }

  // Main reception dashboard.
  return (
    <main className="reception-app">
      <header className="reception-topbar">
        <div className="reception-brand">
          <div className="reception-brand-mark">N</div>

          <div>
            <p className="reception-eyebrow">
              NAMASTE RESTAURANT
            </p>
            <h1>Reception dashboard</h1>
          </div>
        </div>

        <div className="reception-top-actions">
          <span className="reception-live">
            <span />
            Auto-refresh Â· 15 sec
          </span>

          <button
            className="reception-secondary-button"
            onClick={() => loadOrders()}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "â†» Refresh"}
          </button>

          <button
            className="reception-logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="reception-welcome">
        <div>
          <p className="reception-eyebrow">
            SERVICE OVERVIEW
          </p>

          <h2>Every table, one clear bill.</h2>

          <p>
            Additional orders for an active table are
            combined automatically.
          </p>
        </div>

        <div className="reception-today">
          <span>Today</span>

          <strong>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </strong>
        </div>
      </section>

      <section className="reception-stats">
        <button
          className={`reception-stat reception-stat-new ${
            filter === "new" ? "selected" : ""
          }`}
          onClick={() =>
            setFilter(filter === "new" ? "all" : "new")
          }
        >
          <span className="reception-stat-icon">âœ¦</span>
          <span className="reception-stat-label">
            New order batches
          </span>
          <strong>{counts.new}</strong>
          <span className="reception-stat-foot">
            Awaiting action
          </span>
        </button>

        <button
          className={`reception-stat ${
            filter === "preparing" ? "selected" : ""
          }`}
          onClick={() =>
            setFilter(
              filter === "preparing" ? "all" : "preparing"
            )
          }
        >
          <span className="reception-stat-icon">â™¨</span>
          <span className="reception-stat-label">
            Preparing
          </span>
          <strong>{counts.preparing}</strong>
          <span className="reception-stat-foot">
            In the kitchen
          </span>
        </button>

        <button
          className={`reception-stat ${
            filter === "ready" ? "selected" : ""
          }`}
          onClick={() =>
            setFilter(filter === "ready" ? "all" : "ready")
          }
        >
          <span className="reception-stat-icon">âœ“</span>
          <span className="reception-stat-label">
            Ready batches
          </span>
          <strong>{counts.ready}</strong>
          <span className="reception-stat-foot">
            Waiting for service
          </span>
        </button>

        <button
          className={`reception-stat ${
            filter === "all" ? "selected" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          <span className="reception-stat-icon">â–¦</span>
          <span className="reception-stat-label">
            Active tables
          </span>
          <strong>{counts.tables}</strong>
          <span className="reception-stat-foot">
            {counts.totalOrders} open order batches
          </span>
        </button>
      </section>

      {loadError && (
        <div className="reception-alert reception-alert-error">
          <span>{loadError}</span>

          <button onClick={() => loadOrders()}>
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div className="reception-alert reception-alert-success">
          {notice}
        </div>
      )}

      <section className="reception-orders-section">
        <div className="reception-orders-heading">
          <div>
            <p className="reception-eyebrow">
              TABLE MANAGEMENT
            </p>

            <h2>Current table bills</h2>

            <p className="reception-muted">
              Dishes from multiple active submissions are
              combined by table. Cancelled submissions are
              excluded from the bill. A bill stays open until
              reception confirms payment.
            </p>
          </div>

          <div className="reception-order-tools">
            <label className="reception-search">
              <span>âŒ•</span>

              <input
                aria-label="Search tables or dishes"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search table, order or dish"
              />
            </label>

            <select
              aria-label="Filter order status"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="all">All tables</option>

              {ACTIVE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {refreshing && orders.length === 0 ? (
          <div className="reception-empty">
            <div className="reception-spinner" />
            <h3>Loading table bills...</h3>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="reception-empty">
            <div className="reception-empty-icon">âŒ•</div>

            <h3>No matching tables</h3>

            <p>Try another search or status filter.</p>

            <button
              className="reception-secondary-button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Show all tables
            </button>
          </div>
        ) : (
          <div className="reception-order-grid reception-table-grid">
            {filteredTables.map((group) => {
              const occupied = Boolean(group.sessionId);
              const firstStatus = group.summaryStatus;

              return (
                <article
                  className={`reception-order-card reception-table-card ${
                    occupied
                      ? `status-border-${firstStatus}`
                      : "reception-empty-table"
                  }`}
                  key={group.tableNumber}
                >
                  <div className="reception-order-card-head">
                    <div>
                      <div className="reception-table-label">
                        TABLE {group.tableNumber}
                      </div>

                      <h3>
                        {occupied
                          ? `${group.itemCount} item${
                              group.itemCount !== 1 ? "s" : ""
                            } on this bill`
                          : "No active order"}
                      </h3>

                      <p className="reception-order-date">
                        {occupied
                          ? `${
                              group.orders.length
                            } order submission${
                              group.orders.length !== 1 ? "s" : ""
                            }  Started ${dateTime(
                              group.sessionOpenedAt ||
                                group.firstOrderAt
                            )}`
                          : "Ready for the next order"}
                      </p>
                    </div>

                    {occupied ? (
                      <span
                        className={`reception-status-pill status-${firstStatus}`}
                      >
                        {statusLabels[firstStatus] || firstStatus}
                      </span>
                    ) : (
                      <span className="reception-status-pill status-empty">
                        Available
                      </span>
                    )}
                  </div>

                  {occupied ? (
                    <>
                      <div className="reception-items">
                        <div className="reception-items-title">
                          <span>Combined food items</span>

                          <span>
                            {group.items.length} dish type
                            {group.items.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {group.items.map((item) => (
                          <div
                            className="reception-item-row"
                            key={`${item.item_name}-${item.unit_price}`}
                          >
                            <div className="reception-item-quantity">
                              {item.quantity}×
                            </div>

                            <div className="reception-item-name">
                              <strong>{item.item_name}</strong>
                              <span>
                                {money(item.unit_price)} each
                              </span>
                            </div>

                            <strong className="reception-item-price">
                              {money(item.subtotal)}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {group.notes.length > 0 && (
                        <div className="reception-customer-note">
                          <strong>
                            Customer note
                            {group.notes.length > 1 ? "s" : ""}
                          </strong>

                          {group.notes.map((note) => (
                            <p key={note.orderId}>
                              {note.note}
                            </p>
                          ))}
                        </div>
                      )}

                      <details
                        className="reception-table-batches"
                        open={group.orders.length > 1}
                      >
                        <summary>
                          Manage {group.orders.length} saved
                          order batch
                          {group.orders.length !== 1 ? "es" : ""}
                        </summary>

                        <div className="reception-batch-list">
                          {group.orders.map((order) => (
                            <div
                              className="reception-batch-row"
                              key={order.id}
                            >
                              <div className="reception-batch-info">
                                <strong>
                                  #{shortId(order.id)}
                                </strong>

                                <span>
                                  {dateTime(order.created_at)} Â·{" "}
                                  {money(order.total)}
                                </span>
                              </div>

                              <select
                                aria-label={`Status for order ${shortId(
                                  order.id
                                )}`}
                                value={order.status}
                                disabled={
                                  updatingOrderId === order.id
                                }
                                onChange={(event) =>
                                  changeStatus(
                                    order,
                                    event.target.value
                                  )
                                }
                              >
                                {STATUSES.map((status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {statusLabels[status]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>

                        <p className="reception-batch-help">
                          Kitchen status is tracked per submission.
                          Cancelled submissions are excluded from
                          the bill. The bill stays open until
                          reception confirms payment.
                        </p>
                      </details>
                    </>
                  ) : (
                    <div className="reception-table-vacant">
                      <span>â€”</span>
                      <p>
                        Food items will appear here when a customer
                        orders at this table.
                      </p>
                    </div>
                  )}

                  <div className="reception-order-total reception-table-total">
                    <span>Current table bill</span>
                    <strong>{money(group.total)}</strong>
                  </div>

                  {occupied && (
                    <div className="reception-session-actions">
                      <p>
                        After payment, close this bill. The next
                        order will start a fresh bill for this table.
                      </p>

                      <button
                        className="reception-pay-button"
                        onClick={() => closeBill(group)}
                        disabled={
                          closingSessionId === group.sessionId ||
                          Boolean(closingSessionId)
                        }
                      >
                        {closingSessionId === group.sessionId
                          ? "Closing bill..."
                          : " Bill paid · Close table"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="reception-footer">
        <span>Namaste Restaurant</span>
        <span>
          Table bills refresh automatically every 15 seconds
        </span>
      </footer>
    </main>
  );
}


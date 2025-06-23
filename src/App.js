import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { database } from "./firebase";
import { ref, onValue, push, get } from "firebase/database";

// --- Utility ---
function currency(num) {
  return num?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
}
const buttonStyle = (color) => ({
  width: "100%",
  background: color,
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "18px 0",
  margin: "8px 0",
  fontSize: 18,
  fontWeight: 700,
  boxShadow: "0 2px 8px #0002",
  cursor: "pointer",
  transition: "0.1s",
});
const buttonList = [
  {
    label: <>Add Transaction<br /><span style={{ fontSize: 14, fontWeight: 400 }}>اندراج رقم</span></>,
    color: "#43a047",
    screen: "add"
  },
  {
    label: <>Bank Deposit<br /><span style={{ fontSize: 14, fontWeight: 400 }}>بنک جمع</span></>,
    color: "#1976d2",
    screen: "bank"
  },
  {
    label: <>Reports<br /><span style={{ fontSize: 14, fontWeight: 400 }}>رپورٹس</span></>,
    color: "#e53935",
    screen: "report"
  },
  {
    label: <>Manage Transactions<br /><span style={{ fontSize: 14, fontWeight: 400 }}>ٹرانزیکشنز</span></>,
    color: "#8e24aa",
    screen: "transactions"
  },
  {
    label: <>Manage Accounts<br /><span style={{ fontSize: 14, fontWeight: 400 }}>کھاتے</span></>,
    color: "#fbc02d",
    screen: "accounts"
  },
  {
    label: <>Excel<br /><span style={{ fontSize: 14, fontWeight: 400 }}>ایکسسل</span></>,
    color: "#388e3c",
    screen: "excel"
  }
];

// --- Components ---
function MainMenu({ setScreen }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: "linear-gradient(to top,#fff 80%,#f1f8e9 100%)",
    }}>
      <div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#388e3c", letterSpacing: 2 }}>کھاتے</div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "8px 0" }}>Hisab Manager</div>
          <div style={{ color: "#888", fontSize: 20, margin: "24px 0 12px 0", fontWeight: 500 }}>
            <span style={{ fontFamily: "Noto Nastaliq Urdu, serif" }}>جی آیاں نوں</span> / Welcome
          </div>
        </div>
      </div>
      <div style={{
        padding: "16px 10vw 40px 10vw",
        maxWidth: 500,
        margin: "0 auto",
        width: "100%"
      }}>
        {buttonList.map(btn => (
          <button
            key={btn.screen}
            style={buttonStyle(btn.color)}
            onClick={() => setScreen(btn.screen)}
          >{btn.label}</button>
        ))}
      </div>
    </div>
  );
}

function Transactions({ data, setScreen }) {
  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 16 }}>All Transactions<br /><span style={{ fontSize: 15, fontWeight: 400 }}>ٹرانزیکشنز</span></h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Type</th>
            <th>Mode</th>
            <th>Account</th>
            <th>Share Mode</th>
            <th>Share A</th>
            <th>Share B</th>
            <th>Share C</th>
            <th>Shareholder</th>
          </tr>
        </thead>
        <tbody>
          {data.transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.date?.slice(0, 10)}</td>
              <td style={{ textAlign: "right" }}>{currency(tx.amount)}</td>
              <td>{tx.description}</td>
              <td style={{
                color: tx.type === "income" ? "#080" : "#d00",
                fontWeight: 700
              }}>{tx.type}</td>
              <td>{tx.mode}</td>
              <td>{data.accounts[tx.account]?.acname || tx.account}</td>
              <td>{tx.shareMode}</td>
              <td>{tx.share_A}</td>
              <td>{tx.share_B}</td>
              <td>{tx.share_C}</td>
              <td>{tx.shareholder}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setScreen("main")} style={buttonStyle("#8e24aa")}>← Main Menu</button>
    </div>
  );
}

function AddTransactionWizard({ data, addTx, setScreen }) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("income");
  const [mode, setMode] = useState("cash");
  const [account, setAccount] = useState("");
  const [shareMode, setShareMode] = useState("common");
  const [shareA, setShareA] = useState("");
  const [shareB, setShareB] = useState("");
  const [shareC, setShareC] = useState("");
  const [shareholder, setShareholder] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const steps = [
    "Enter Amount",
    "Enter Description",
    "Select Transaction Type",
    "Select Mode",
    "Select Account",
    "Select Share Mode",
    "Enter Shares (A/B/C) or Select Shareholder",
    "Select Date",
    "Confirm Details"
  ];

  const accountsList = Object.values(data.accounts || {});
  const shareholdersList = Object.values(data.shareholders || {});

  function next() {
    setError("");
    if (step === 0 && (!amount || isNaN(amount) || Number(amount) <= 0)) return setError("Enter valid amount.");
    if (step === 1 && !description.trim()) return setError("Description required.");
    if (step === 2 && !type) return setError("Select type.");
    if (step === 3 && !mode) return setError("Select mode.");
    if (step === 4 && !account) return setError("Select account.");
    if (step === 5 && !shareMode) return setError("Select share mode.");
    if (step === 6) {
      if (shareMode === "common" && (shareA === "" || shareB === "" || shareC === "")) return setError("Enter all shares (A/B/C).");
      if (shareMode === "individual" && !shareholder) return setError("Select shareholder.");
    }
    if (step === 7 && !date) return setError("Select date.");
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
    setError("");
  }
  function finish() {
    addTx({
      id: null,
      amount: Number(amount),
      description,
      type,
      mode,
      account: Number(account),
      shareMode,
      share_A: shareMode === "common" ? Number(shareA) : null,
      share_B: shareMode === "common" ? Number(shareB) : null,
      share_C: shareMode === "common" ? Number(shareC) : null,
      shareholder: shareMode === "individual" ? shareholder : "",
      date: date + " 00:00:00"
    });
    setScreen("transactions");
  }

  return (
    <div style={{ padding: 24, maxWidth: 440, margin: "auto", background: "#f7f7fd", borderRadius: 12, boxShadow: "0 2px 8px #aaa2", marginTop: 40 }}>
      <h3>Transaction Wizard<br /><span style={{ fontWeight: 400, fontSize: 15 }}>اندراج رقم</span></h3>
      <h4>{steps[step]}</h4>
      {step === 0 && (
        <input type="number" value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount / رقم" style={{ width: "100%", padding: 8 }} />
      )}
      {step === 1 && (
        <input type="text" value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description / تفصیل" style={{ width: "100%", padding: 8 }} />
      )}
      {step === 2 && (
        <div>
          <button
            style={{ marginRight: 16, background: type === "income" ? "#bdf" : "#eee", fontWeight: 600 }}
            onClick={() => setType("income")}>Income / آمدن</button>
          <button
            style={{ background: type === "expense" ? "#fbf" : "#eee", fontWeight: 600 }}
            onClick={() => setType("expense")}>Expense / خرچ</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <button
            style={{ marginRight: 16, background: mode === "cash" ? "#bdf" : "#eee", fontWeight: 600 }}
            onClick={() => setMode("cash")}>Cash</button>
          <button
            style={{ background: mode === "credit" ? "#fbf" : "#eee", fontWeight: 600 }}
            onClick={() => setMode("credit")}>Credit</button>
        </div>
      )}
      {step === 4 && (
        <select value={account} onChange={e => setAccount(e.target.value)} style={{ width: "100%", padding: 8 }}>
          <option value="">Select account...</option>
          {accountsList.map(ac => (
            <option key={ac.ac} value={ac.ac}>{ac.acname} ({ac.ac})</option>
          ))}
        </select>
      )}
      {step === 5 && (
        <div>
          <button
            style={{ marginRight: 16, background: shareMode === "common" ? "#bdf" : "#eee", fontWeight: 600 }}
            onClick={() => setShareMode("common")}>Common</button>
          <button
            style={{ background: shareMode === "individual" ? "#fbf" : "#eee", fontWeight: 600 }}
            onClick={() => setShareMode("individual")}>Individual</button>
        </div>
      )}
      {step === 6 && (
        shareMode === "common" ? (
          <div>
            <input type="number" value={shareA} onChange={e => setShareA(e.target.value)} placeholder="Share A" style={{ width: "32%", marginRight: 4, padding: 8 }} />
            <input type="number" value={shareB} onChange={e => setShareB(e.target.value)} placeholder="Share B" style={{ width: "32%", marginRight: 4, padding: 8 }} />
            <input type="number" value={shareC} onChange={e => setShareC(e.target.value)} placeholder="Share C" style={{ width: "32%", padding: 8 }} />
          </div>
        ) : (
          <select value={shareholder} onChange={e => setShareholder(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="">Select shareholder...</option>
            {shareholdersList.map(sh => (
              <option key={sh.id} value={sh.name}>{sh.name}</option>
            ))}
          </select>
        )
      )}
      {step === 7 && (
        <input type="date" value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: "100%", padding: 8 }} />
      )}
      {step === 8 && (
        <div>
          <div><b>Amount:</b> {currency(Number(amount))}</div>
          <div><b>Description:</b> {description}</div>
          <div><b>Type:</b> {type}</div>
          <div><b>Mode:</b> {mode}</div>
          <div><b>Account:</b> {data.accounts[account]?.acname || account}</div>
          <div><b>Share Mode:</b> {shareMode}</div>
          {shareMode === "common" ? (
            <div>
              <b>Shares:</b> A: {shareA} | B: {shareB} | C: {shareC}
            </div>
          ) : (
            <div>
              <b>Shareholder:</b> {shareholder}
            </div>
          )}
          <div><b>Date:</b> {date}</div>
        </div>
      )}
      {error && <div style={{ color: "#c00", marginTop: 12 }}>{error}</div>}
      <div style={{ marginTop: 28 }}>
        {step > 0 && <button onClick={back}>Back</button>}
        {step < 8 && <button style={{ float: "right" }} onClick={next}>Next</button>}
        {step === 8 && (
          <button style={{ float: "right", background: "#2e5", fontWeight: 700 }} onClick={finish}>Add Transaction</button>
        )}
        <button style={{ float: "right", marginRight: 12, color: "#c00" }} onClick={() => setScreen("main")}>Cancel</button>
      </div>
    </div>
  );
}

// (other components unchanged, just as in previous full file)
function BankDeposit({ data, addDeposit, setScreen }) {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const bankAccounts = Object.values(data.accounts).filter(
    ac => typeof ac.catagory === "string" && ac.catagory.toLowerCase().includes("bank")
  );

  function handleDeposit() {
    setError("");
    if (!account) return setError("Select bank account.");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError("Enter valid amount.");
    if (!date) return setError("Select date.");
    addDeposit({
      id: null,
      type: "deposit",
      account: Number(account),
      description: description || "Bank Deposit",
      amount: Number(amount),
      date: date + " 00:00:00"
    });
    setScreen("transactions");
  }

  return (
    <div style={{ padding: 24, maxWidth: 440, margin: "auto", background: "#e3f2fd", borderRadius: 12, boxShadow: "0 2px 8px #aaa2", marginTop: 40 }}>
      <h3>Bank Deposit<br /><span style={{ fontWeight: 400, fontSize: 15 }}>بنک جمع</span></h3>
      <select value={account} onChange={e => setAccount(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 12 }}>
        <option value="">Select bank account...</option>
        {bankAccounts.map(ac => (
          <option key={ac.ac} value={ac.ac}>{ac.acname} ({ac.ac})</option>
        ))}
      </select>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" style={{ width: "100%", padding: 8, marginTop: 12 }} />
      <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" style={{ width: "100%", padding: 8, marginTop: 12 }} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 12 }} />
      {error && <div style={{ color: "#c00", marginTop: 12 }}>{error}</div>}
      <div style={{ marginTop: 24 }}>
        <button style={{ ...buttonStyle("#1976d2"), width: 120, marginRight: 10 }} onClick={handleDeposit}>Deposit</button>
        <button style={{ ...buttonStyle("#ccc"), color: "#222", width: 120 }} onClick={() => setScreen("main")}>Cancel</button>
      </div>
    </div>
  );
}

function Reports({ transactions, accounts, shareholders, setScreen }) {
  // ...no change needed...
  // Just copy from previous code.
  const totals = {};
  transactions.forEach(tx => {
    if (!totals[tx.account]) totals[tx.account] = { income: 0, expense: 0, deposit: 0 };
    if (tx.type === "income") totals[tx.account].income += tx.amount;
    else if (tx.type === "expense") totals[tx.account].expense += tx.amount;
    else if (tx.type === "deposit") totals[tx.account].deposit += tx.amount;
  });
  const shTotals = {};
  Object.values(shareholders).forEach(sh => {
    shTotals[sh.name] = { share_A: 0, share_B: 0, share_C: 0, total: 0 };
  });
  transactions.forEach(tx => {
    if (tx.type === "income") {
      Object.values(shareholders).forEach(sh => {
        shTotals[sh.name].share_A += tx.amount * (sh.share_A || 0);
        shTotals[sh.name].share_B += tx.amount * (sh.share_B || 0);
        shTotals[sh.name].share_C += tx.amount * (sh.share_C || 0);
      });
    }
  });
  Object.values(shTotals).forEach(sh => {
    sh.total = sh.share_A + sh.share_B + sh.share_C;
  });

  return (
    <div>
      <h3 style={{ textAlign: "center" }}>Reports<br /><span style={{ fontWeight: 400, fontSize: 15 }}>رپورٹس</span></h3>
      <h4>Account-wise Totals</h4>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Account</th>
            <th>Income</th>
            <th>Expense</th>
            <th>Deposit</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(accounts).map(ac => (
            <tr key={ac}>
              <td>{accounts[ac].acname}</td>
              <td style={{ color: "#080", textAlign: "right" }}>{currency(totals[ac]?.income)}</td>
              <td style={{ color: "#d00", textAlign: "right" }}>{currency(totals[ac]?.expense)}</td>
              <td style={{ color: "#1976d2", textAlign: "right" }}>{currency(totals[ac]?.deposit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setScreen("main")} style={buttonStyle("#e53935")}>← Main Menu</button>
    </div>
  );
}

function AccountsTable({ accounts, setScreen }) {
  return (
    <div>
      <h3 style={{ textAlign: "center" }}>Accounts<br /><span style={{ fontWeight: 400, fontSize: 15 }}>کھاتے</span></h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Income Flag</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(accounts).map(ac => (
            <tr key={ac.ac}>
              <td>{ac.ac}</td>
              <td>{ac.acname}</td>
              <td>{ac.incflag}</td>
              <td>{ac.catagory}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setScreen("main")} style={buttonStyle("#fbc02d")}>← Main Menu</button>
    </div>
  );
}

function ShareholdersTable({ shareholders, setScreen }) {
  return (
    <div>
      <h3 style={{ textAlign: "center" }}>Shareholders<br /><span style={{ fontWeight: 400, fontSize: 15 }}>شئیرہولڈر</span></h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Share A</th>
            <th>Share B</th>
            <th>Share C</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(shareholders).map(sh => (
            <tr key={sh.id}>
              <td>{sh.id}</td>
              <td>{sh.name}</td>
              <td>{sh.share_A}</td>
              <td>{sh.share_B}</td>
              <td>{sh.share_C}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setScreen("main")} style={buttonStyle("#8e24aa")}>← Main Menu</button>
    </div>
  );
}

function ExcelStub({ data, setScreen }) {
  function handleExport() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data.transactions);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "hisab_transactions.xlsx");
  }
  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h3>Excel<br /><span style={{ fontWeight: 400, fontSize: 15 }}>ایکسسل</span></h3>
      <div style={{ margin: "40px 0", color: "#888" }}>
        <button style={buttonStyle("#388e3c")} onClick={handleExport}>Export Transactions to Excel</button>
      </div>
      <button onClick={() => setScreen("main")} style={buttonStyle("#388e3c")}>← Main Menu</button>
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const [data, setData] = useState(null);
  const [screen, setScreen] = useState("main");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const dataRef = ref(database, "/");
    const unsub = onValue(dataRef, (snapshot) => {
      const d = snapshot.val() || {};
      setData(d);
      setTransactions(Object.values(d.transactions || {}));
    });
    return () => unsub();
  }, []);

  async function addTx(tx) {
    const txRef = ref(database, "transactions");
    const snapshot = await get(txRef);
    let id = 1;
    if (snapshot.exists()) {
      const txs = snapshot.val();
      const txIds = Object.values(txs).map((t) => t.id || 0);
      id = txIds.length ? Math.max(...txIds) + 1 : 1;
    }
    const newTx = { ...tx, id };
    await push(txRef, newTx);
  }

  async function addDeposit(tx) {
    await addTx({ ...tx, type: "deposit" });
  }

  if (!data)
    return <div style={{ padding: 32, fontFamily: "monospace" }}>Loading data from Firebase...</div>;

  const extendedData = { ...data, transactions };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1200, margin: "auto", padding: 0 }}>
      {screen === "main" && <MainMenu setScreen={setScreen} />}
      {screen === "transactions" && <Transactions data={extendedData} setScreen={setScreen} />}
      {screen === "add" && <AddTransactionWizard data={data} addTx={addTx} setScreen={setScreen} />}
      {screen === "bank" && <BankDeposit data={data} addDeposit={addDeposit} setScreen={setScreen} />}
      {screen === "report" && <Reports transactions={transactions} accounts={data.accounts} shareholders={data.shareholders} setScreen={setScreen} />}
      {screen === "accounts" && <AccountsTable accounts={data.accounts} setScreen={setScreen} />}
      {screen === "shareholders" && <ShareholdersTable shareholders={data.shareholders} setScreen={setScreen} />}
      {screen === "excel" && <ExcelStub data={extendedData} setScreen={setScreen} />}
    </div>
  );
}

export default App;
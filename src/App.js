import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx"; // Install with: npm install xlsx

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
            <th>Description</th>
            <th>Account</th>
            <th>Account Name</th>
            <th>Amount</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {data.transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.date.slice(0, 10)}</td>
              <td>{tx.description}</td>
              <td>{tx.account}</td>
              <td>{data.accounts[tx.account]?.acname || ""}</td>
              <td style={{ textAlign: "right" }}>{currency(tx.amount)}</td>
              <td style={{
                color: tx.type === "income" ? "#080" : tx.type === "deposit" ? "#1976d2" : "#d00",
                fontWeight: 700
              }}>{tx.type}</td>
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
  const [type, setType] = useState("income");
  const [account, setAccount] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const steps = [
    "Choose Transaction Type",
    "Select Account",
    "Enter Description",
    "Enter Amount",
    "Enter Date",
    "Confirm Details"
  ];

  const filteredAccounts = Object.values(data.accounts).filter(
    (ac) => (type === "income" ? ac.incflag === 1 : ac.incflag === 0)
  );

  function next() {
    setError("");
    if (step === 0 && !type) return setError("Select type.");
    if (step === 1 && !account) return setError("Select account.");
    if (step === 2 && !description.trim()) return setError("Description required.");
    if (step === 3 && (!amount || isNaN(amount) || Number(amount) <= 0))
      return setError("Enter valid amount.");
    if (step === 4 && !date) return setError("Select date.");
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
    setError("");
  }
  function finish() {
    addTx({
      id: null,
      type,
      account: Number(account),
      description,
      amount: Number(amount),
      date: date + " 00:00:00"
    });
    setScreen("transactions");
  }

  return (
    <div style={{ padding: 24, maxWidth: 440, margin: "auto", background: "#f7f7fd", borderRadius: 12, boxShadow: "0 2px 8px #aaa2" }}>
      <h3>Transaction Wizard<br /><span style={{ fontWeight: 400, fontSize: 15 }}>اندراج رقم</span></h3>
      <h4>{steps[step]}</h4>
      {step === 0 && (
        <div>
          <button
            style={{ marginRight: 16, background: type === "income" ? "#bdf" : "#eee", fontWeight: 600 }}
            onClick={() => setType("income")}>Income / آمدن</button>
          <button
            style={{ background: type === "expense" ? "#fbf" : "#eee", fontWeight: 600 }}
            onClick={() => setType("expense")}>Expense / خرچ</button>
        </div>
      )}
      {step === 1 && (
        <select value={account} onChange={e => setAccount(e.target.value)} style={{ width: "100%", padding: 8 }}>
          <option value="">Select account...</option>
          {filteredAccounts.map(ac => (
            <option key={ac.ac} value={ac.ac}>{ac.acname} ({ac.ac})</option>
          ))}
        </select>
      )}
      {step === 2 && (
        <input type="text" value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description / تفصیل" style={{ width: "100%", padding: 8 }} />
      )}
      {step === 3 && (
        <input type="number" value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount / رقم" style={{ width: "100%", padding: 8 }} />
      )}
      {step === 4 && (
        <input type="date" value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: "100%", padding: 8 }} />
      )}
      {step === 5 && (
        <div>
          <div><b>Type:</b> {type}</div>
          <div><b>Account:</b> {data.accounts[account]?.acname || account}</div>
          <div><b>Description:</b> {description}</div>
          <div><b>Amount:</b> {currency(Number(amount))}</div>
          <div><b>Date:</b> {date}</div>
        </div>
      )}
      {error && <div style={{ color: "#c00", marginTop: 12 }}>{error}</div>}
      <div style={{ marginTop: 28 }}>
        {step > 0 && <button onClick={back}>Back</button>}
        {step < 5 && <button style={{ float: "right" }} onClick={next}>Next</button>}
        {step === 5 && (
          <button style={{ float: "right", background: "#2e5", fontWeight: 700 }} onClick={finish}>Add Transaction</button>
        )}
        <button style={{ float: "right", marginRight: 12, color: "#c00" }} onClick={() => setScreen("main")}>Cancel</button>
      </div>
    </div>
  );
}

// --- FIXED --- BankDeposit with safe .toLowerCase usage!
function BankDeposit({ data, addDeposit, setScreen }) {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  // Safe filter: only call .toLowerCase() if catagory is a string
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
        shTotals[sh.name].share_A += tx.amount * sh.share_A;
        shTotals[sh.name].share_B += tx.amount * sh.share_B;
        shTotals[sh.name].share_C += tx.amount * sh.share_C;
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
      <h4 style={{ marginTop: 30 }}>Shareholder Shares (All Income)</h4>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Share A</th>
            <th>Share B</th>
            <th>Share C</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(shareholders).map(k => (
            <tr key={k}>
              <td>{k}</td>
              <td style={{ textAlign: "right" }}>{currency(shTotals[k].share_A)}</td>
              <td style={{ textAlign: "right" }}>{currency(shTotals[k].share_B)}</td>
              <td style={{ textAlign: "right" }}>{currency(shTotals[k].share_C)}</td>
              <td style={{ fontWeight: 700, textAlign: "right" }}>{currency(shTotals[k].total)}</td>
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

// MAIN APP
function App() {
  const [data, setData] = useState(null);
  const [screen, setScreen] = useState("main");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("/firebase_best_practice_ready.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTransactions(Object.values(d.transactions || {}));
      });
  }, []);

  function addTx(tx) {
    setTransactions(prev => [
      ...prev,
      {
        ...tx,
        id: prev.length ? Math.max(...prev.map(t => t.id)) + 1 : 1,
      }
    ]);
  }

  function addDeposit(tx) {
    setTransactions(prev => [
      ...prev,
      {
        ...tx,
        id: prev.length ? Math.max(...prev.map(t => t.id)) + 1 : 1,
      }
    ]);
  }

  if (!data)
    return <div style={{ padding: 32, fontFamily: "monospace" }}>Loading data...</div>;

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

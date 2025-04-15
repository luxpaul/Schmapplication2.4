import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vuigqwczmddevamgthtp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aWdxd2N6bWRkZXZhbWd0aHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTEyNzUsImV4cCI6MjA2MDI4NzI3NX0.9Vu6Myvzz5ZHsSL9eU69mnVMELZSu0ndlCSg6TmPASg"
);

export default function SchmackApp({ user }) {
  const [showResponse, setShowResponse] = useState(false);
  const [message, setMessage] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");
  const [messageLog, setMessageLog] = useState([]);
  const [sharedCounter, setSharedCounter] = useState(0);

  useEffect(() => {
    const fetchCounter = async () => {
      const { data } = await supabase
        .from("counters")
        .select("value")
        .eq("name", "liebemoin")
        .single();
      if (data) {
        setSharedCounter(data.value);
      }
    };
    fetchCounter();
  }, []);

  const otherUser = user === "paul" ? "carla" : "paul";

  useEffect(() => {
    const fetchLatestMessage = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("to_user", user)
        .eq("show_button", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setReceivedMessage(data[0].text);
        setShowResponse(true);
      }
    };

    const fetchLog = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`from_user.eq.${user},to_user.eq.${user}`)
        .order("created_at", { ascending: false });

      const formatted = data.map(msg => ({
        from: msg.from_user,
        text: msg.text,
        date: new Date(msg.created_at).toLocaleDateString("de-DE"),
        time: new Date(msg.created_at).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      }));

      setMessageLog(formatted);
    };

    fetchLatestMessage();
    fetchLog();
  }, [user]);

  const handleLiebeLiebe = async () => {
    if (navigator.vibrate) navigator.vibrate(100);

    const { error } = await supabase.from("messages").insert({
      from_user: user,
      to_user: otherUser,
      text: message.trim(),
      show_button: true
    });

    if (!error) {
      setMessage("");
    }
  };

  const handleLiebeMoin = async () => {
    if (navigator.vibrate) navigator.vibrate(100);
    setShowResponse(false);
    setReceivedMessage("");

    // Find latest message and update its show_button = false
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("to_user", user)
      .eq("show_button", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      await supabase
        .from("messages")
        .update({ show_button: false })
        .eq("id", data[0].id);

      const updated = sharedCounter + 1;
      setSharedCounter(updated);
      const { error } = await supabase
        .from("counters")
        .upsert({ name: "liebemoin", value: updated }, { onConflict: "name" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white gap-4 text-center px-4 pt-8">
      <p className="text-sm italic text-gray-500 max-w-md">
        🐾 Zitat des Tages: "Ein Leben ohne Hund ist möglich, aber sinnlos. – Xie-Xie"
      </p>

      <h1 className="text-2xl font-semibold mt-2">Hallo {user} 💌</h1>

      <textarea
        className="border rounded p-2 w-full max-w-xs text-lg"
        rows="3"
        placeholder="Deine Liebesnachricht..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="px-6 py-3 rounded-full text-white bg-red-500 text-xl shadow"
        onClick={handleLiebeLiebe}
      >
        liebeliebe
      </button>

      {showResponse && (
        <>
          <button
            className="px-6 py-3 rounded-full text-white bg-pink-600 text-xl shadow"
            onClick={handleLiebeMoin}
          >
            liebemoin
          </button>
          <div className="mt-4 bg-pink-50 border border-pink-200 p-3 rounded shadow max-w-xs">
            <p className="text-pink-700 font-medium">💬 Liebesnachricht:</p>
            <p className="text-pink-800 mt-1">{receivedMessage || "Keine Nachricht übermittelt."}</p>
          </div>
        </>
      )}

      <div className="text-gray-600 mt-6">
        💞 Gemeinsamer liebemoin-Zähler: <strong>{sharedCounter}</strong>
      </div>

      {messageLog.length > 0 && (
        <div className="mt-6 w-full max-w-md text-left text-sm text-gray-600">
          <h2 className="font-semibold mb-2">📜 Nachrichtenverlauf:</h2>
          <ul className="space-y-1">
            {messageLog.map((msg, idx) => (
              <li key={idx}>
                <span className="font-bold">{msg.from}</span> @ {msg.time} am {msg.date}: "{msg.text}"
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

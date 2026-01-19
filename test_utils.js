
// Custom hmToMin implementation from utils.ts to test isolation
function pad(n) { return String(n).padStart(2, "0"); }

function hmToMin(hm) {
    if (!hm) return 0;
    const [h, m] = hm.split(":").map(Number);
    return h * 60 + m;
}

function computeMinutesFromTimes(obj) {
    if (!obj) return 0;
    console.log("Input:", obj);
    const a = hmToMin(obj.start || "");
    const b = hmToMin(obj.lunchStart || "");
    const c = hmToMin(obj.lunchEnd || "");
    const d = hmToMin(obj.end || "");

    console.log("Parsed:", { a, b, c, d });

    if (!obj.start || !obj.end) {
        console.log("Missing start or end");
        return 0;
    }

    // No lunch break
    if (!obj.lunchStart || !obj.lunchEnd) {
        console.log("No lunch break defined");
        return Math.max(0, d - a);
    }

    // With lunch break
    if (b < a || c < b || d < c) {
        console.log("Chronological error:", {
            "b < a": b < a,
            "c < b": c < b,
            "d < c": d < c
        });
        return 0;
    }

    const first = Math.max(0, b - a);
    const second = Math.max(0, d - c);
    console.log("Segments:", { first, second });
    return first + second;
}

const inputs = {
    start: "09:00",
    lunchStart: "12:30",
    lunchEnd: "14:00",
    end: "17:30"
};

const result = computeMinutesFromTimes(inputs);
console.log("Result:", result);

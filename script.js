document.documentElement.classList.add("js");

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const now = new Date();
const calendarYear = now.getFullYear();
const calendarMonth = now.getMonth();
const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
const firstSaturday = 1 + ((6 - firstWeekday + 7) % 7);
const familyDinnerDay = firstSaturday + 14;
const monthGrid = document.querySelector(".month-grid");
const monthHeading = document.querySelector("#calendar-month");
const demoMessages = document.querySelector(".demo-messages");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector("#prompt-input");
const exampleText = document.querySelector(".example-text");
const examplePrompts = [
  "Move my flight later by 3 hours",
  "Add an alert reminder to get cups before meeting family on Saturday",
  "Add a reminder between my flight and meeting my family to get a rental car",
];
let exampleIndex = 0;
let typingTimer;
let events = createInitialEvents();

monthHeading.textContent = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
}).format(now);

function createInitialEvents() {
  return [
    { id: "flight", title: "Flight", day: 5, minutes: 5 * 60, type: "travel" },
    { id: "office-meeting", title: "Office meeting", day: 11, minutes: 15 * 60, type: "meeting" },
    { id: "family-dinner", title: "Family dinner", day: familyDinnerDay, minutes: 19 * 60, type: "personal" },
  ];
}

function formatTime(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function renderCalendar() {
  monthGrid.replaceChildren();

  for (let index = 0; index < firstWeekday; index += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "month-day is-empty";
    emptyCell.setAttribute("role", "group");
    emptyCell.setAttribute("aria-hidden", "true");
    monthGrid.append(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayEvents = events
      .filter((event) => event.day === day)
      .sort((a, b) => a.minutes - b.minutes);
    const cell = document.createElement("div");
    cell.className = `month-day${day === now.getDate() ? " is-today" : ""}`;
    cell.setAttribute("role", "group");
    const date = new Date(calendarYear, calendarMonth, day);
    const dateLabel = new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);
    cell.setAttribute(
      "aria-label",
      dayEvents.length
        ? `${dateLabel}: ${dayEvents.map((event) => `${event.title} at ${formatTime(event.minutes)}`).join(", ")}`
        : dateLabel,
    );

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(day);
    cell.append(number);

    dayEvents.forEach((event) => {
      const eventElement = document.createElement("div");
      eventElement.className = `calendar-event event-${event.type}`;
      eventElement.title = `${event.title} · ${formatTime(event.minutes)}`;
      const title = document.createElement("strong");
      title.textContent = event.title;
      const time = document.createElement("span");
      time.textContent = formatTime(event.minutes);
      eventElement.append(title, time);
      cell.append(eventElement);
    });

    monthGrid.append(cell);
  }
}

function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = className;
  message.textContent = text;
  demoMessages.append(message);
  demoMessages.scrollTop = demoMessages.scrollHeight;
}

function interpretPrompt(prompt) {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("flight") && normalizedPrompt.includes("later")) {
    const flight = events.find((event) => event.id === "flight");
    if (!flight) {
      return "I couldn't find the flight on your calendar.";
    }

    const hours = Number(normalizedPrompt.match(/(\d+)\s*hours?/)?.[1] ?? 3);
    flight.minutes += hours * 60;
    renderCalendar();
    return `Done. I moved your flight ${hours} hours later, to ${formatTime(flight.minutes)}.`;
  }

  if (normalizedPrompt.includes("cups") && normalizedPrompt.includes("family")) {
    if (events.some((event) => event.id === "cups-reminder")) {
      return "You already have an alert to get cups before family dinner.";
    }

    events.push({
      id: "cups-reminder",
      title: "Get cups · alert",
      day: familyDinnerDay,
      minutes: 17 * 60 + 30,
      type: "reminder",
    });
    renderCalendar();
    return `Added an alert to get cups at ${formatTime(17 * 60 + 30)}, before family dinner.`;
  }

  if (normalizedPrompt.includes("rental car") && normalizedPrompt.includes("flight")) {
    if (events.some((event) => event.id === "rental-reminder")) {
      return "You already have a reminder to get a rental car between your flight and family dinner.";
    }

    events.push({
      id: "rental-reminder",
      title: "Get rental car",
      day: familyDinnerDay - 1,
      minutes: 10 * 60,
      type: "reminder",
    });
    renderCalendar();
    return "Added a reminder to get a rental car the day after your flight, before family dinner.";
  }

  return "I can update the flight time, add the cups alert, or schedule the rental-car reminder. Try one of those requests.";
}

function showExample(index) {
  window.clearInterval(typingTimer);
  exampleIndex = (index + examplePrompts.length) % examplePrompts.length;
  const prompt = examplePrompts[exampleIndex];
  exampleText.textContent = "";

  if (reduceMotion) {
    exampleText.textContent = prompt;
    exampleText.classList.remove("is-typing");
    return;
  }

  exampleText.classList.add("is-typing");
  let characterIndex = 0;
  typingTimer = window.setInterval(() => {
    characterIndex += 1;
    exampleText.textContent = prompt.slice(0, characterIndex);
    if (characterIndex >= prompt.length) {
      window.clearInterval(typingTimer);
      exampleText.classList.remove("is-typing");
    }
  }, 24);
}

function submitPrompt(prompt) {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    promptInput.focus();
    return;
  }

  addMessage(trimmedPrompt, "user-message");
  addMessage(interpretPrompt(trimmedPrompt), "assistant-message");
  promptInput.value = "";
}

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitPrompt(promptInput.value);
});

document.querySelector(".next-example").addEventListener("click", () => {
  showExample(exampleIndex + 1);
});

document.querySelector(".run-example").addEventListener("click", () => {
  submitPrompt(examplePrompts[exampleIndex]);
});

document.querySelector(".reset-demo").addEventListener("click", () => {
  events = createInitialEvents();
  demoMessages.replaceChildren();
  const welcome = document.createElement("div");
  welcome.className = "assistant-message";
  welcome.textContent = "Hi! Try an example or tell me how you’d like to update your plans.";
  demoMessages.append(welcome);
  renderCalendar();
  promptInput.value = "";
  showExample(0);
});

renderCalendar();
showExample(0);
window.setInterval(() => showExample(exampleIndex + 1), 6500);

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

const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector("#prompt-input");
const demoMessages = document.querySelector(".demo-messages");
const scheduleUpdate = document.querySelector(".demo-schedule-update");

function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = className;
  message.textContent = text;
  demoMessages.append(message);
  demoMessages.scrollTop = demoMessages.scrollHeight;
}

function interpretPrompt(prompt) {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("focus")) {
    return {
      reply: "Done. I moved your focus time to tomorrow at 9:00 AM, and kept the rest of your day clear.",
      title: "Focus time",
      time: "Tomorrow · 9:00–10:00 AM",
    };
  }
  if (normalizedPrompt.includes("lunch")) {
    return {
      reply: "Sounds lovely. I added lunch with Maya for Friday at noon.",
      title: "Lunch with Maya",
      time: "Friday · 12:00–1:00 PM",
    };
  }
  if (normalizedPrompt.includes("afternoon") || normalizedPrompt.includes("deep work")) {
    return {
      reply: "Done. I protected Friday afternoon for deep work, so nothing else will get in the way.",
      title: "Deep work",
      time: "Friday · 1:00–5:00 PM",
    };
  }
  return {
    reply: `Got it: “${prompt}” — I’d find a time that works and confirm the calendar changes with you.`,
  };
}

function showScheduleUpdate(title, time) {
  scheduleUpdate.querySelector(".update-title").textContent = title;
  scheduleUpdate.querySelector(".update-time").textContent = time;
  scheduleUpdate.hidden = false;
}

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();

  if (!prompt) {
    promptInput.focus();
    return;
  }

  addMessage(prompt, "user-message");
  const result = interpretPrompt(prompt);
  addMessage(result.reply, "assistant-message");
  if (result.title && result.time) {
    showScheduleUpdate(result.title, result.time);
  } else {
    scheduleUpdate.hidden = true;
  }
  promptInput.value = "";
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
    promptForm.requestSubmit();
  });
});

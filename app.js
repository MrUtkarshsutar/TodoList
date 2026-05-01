const appData = {
    tasks: {
        routine: {},
        generatedSchedule: [],
        todos: []
    },
    fitnessLogs: [],
    workout: [],
    goals: [],
    settings: {
        activeView: "dashboard"
    }
};

const viewContent = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Track Your day ,goals, and progress"
    },
    tasks: {
        title: "Tasks",
        subtitle: "Plan your day and organize it accordingly"
    },
    fitness: {
        title: "Fitness",
        subtitle: "Log your nutrition, hydration, and daily intake."
    },
    workout: {
        title: "Workout",
        subtitle: "Track your exercises and build your session."
    }
};
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const quickButtons = document.querySelectorAll("[data-target]");
const plannerForm = document.getElementById("plannerForm");
const availableTime = document.getElementById("availableTime");
const scheduleList = document.getElementById("scheduleList");
const errorMessage = document.getElementById("errorMessage");
const fitnessMessage = document.getElementById("fitnessMessage");
const workoutMessage = document.getElementById("workoutMessage");
const previewListContainer = document.querySelector(".preview-list");

const plannerFields = {
    wake: document.getElementById("wakeTime"),
    sleep: document.getElementById("sleepTime"),
    lunch: document.getElementById("lunchTime"),
    dinner: document.getElementById("dinnerTime"),
    study: document.getElementById("studyHours"),
    fitness: document.getElementById("fitnessMinutes"),
    workoutPref: document.getElementById("workoutPref"),
    work: document.getElementById("workHours"),
    personal: document.getElementById("personalHours"),
    workoutTime: document.getElementById("workoutTime")
};

function showView(viewName) {
    const targetView = document.getElementById(`${viewName}-view`);
    const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    const content = viewContent[viewName];

    if (!targetView || !targetNav || !content)
        return;

    views.forEach((view) =>
        view.classList.remove("active"));
    navItems.forEach((item) =>
        item.classList.remove("active"));

    targetView.classList.add("active");
    targetNav.classList.add("active");

    pageTitle.textContent = content.title;
    pageSubtitle.textContent = content.subtitle;

    appData.settings.activeView = viewName;
    localStorage.setItem("modemuse-active-view", viewName);
}



const savedView = localStorage.getItem("modemuse-active-view");
const initialView = savedView && viewContent[savedView] ? savedView : "dashboard";

function loadData() {
    const savedData = localStorage.getItem("modemuse-data");
    if (!savedData)
        return;

    const parsed = JSON.parse(savedData);
    Object.assign(appData, parsed);
}

const dashboardTaskStat = document.querySelector("#dashboard-task-stat");
const dashboardworkoutstat = document.querySelector("#workout-total-stat")

function renderDashboard() {
    let totalTasks = appData.tasks.todos.length;
    let completedTasks = appData.tasks.todos.filter(task => task.status === "completed").length;

    const pendingTasks = totalTasks - completedTasks;

    if (dashboardTaskStat) {
        dashboardTaskStat.textContent = `${totalTasks} Planned`;

    }
    let totalworkout = appData.workout.length;
    if (dashboardworkoutstat) {
        dashboardworkoutstat.innerHTML = `${totalworkout} Exercise Planned`;
    }


    if (!previewListContainer) {
        return;
    }
    if (appData.tasks.generatedSchedule.length === 0) {
        previewListContainer.innerHTML = "<p>No Schedule planned for today. </p>";
        return;
    }
    previewListContainer.innerHTML = "";
    const minischedule = appData.tasks.generatedSchedule.slice(0, 3);
    minischedule.forEach((item) => {
        let mini = `
            <div class="preview-item">
              <strong> ${item.startTime} </strong>
              <span> ${item.label}</span>
            </div>`;
        previewListContainer.innerHTML += mini;
    });

}

function saveData() {
    localStorage.setItem("modemuse-data", JSON.stringify(appData));
}


function bindEvents() {
    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            const viewname = item.dataset.view;
            showView(viewname);
        });
    });

    quickButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.target;
            if (target) {
                showView(target);
            }
        })
    })
    if (plannerForm) {
        plannerForm.addEventListener("submit", handlebuttonplanner);
    }

    const todoButton = document.querySelector(".todo-form .submit-btn");
    const fitnessButton = document.querySelector(".fitness-form .submit-btn");
    const workoutButton = document.querySelector(".workout-form .submit-btn");

    if (todoButton) {
        todoButton.addEventListener("click", handletodoadd);
    }
    if (fitnessButton) {
        fitnessButton.addEventListener("click", handlefitnessadd);
    }
    if (workoutButton) {
        workoutButton.addEventListener("click", handletoworkoutAdd);
    }
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}


function handlebuttonplanner(event) {
    event.preventDefault();
    const wake = plannerFields.wake.value;
    const sleep = plannerFields.sleep.value;
    const lunch = plannerFields.lunch ? plannerFields.lunch.value : "13:00";
    const dinner = plannerFields.dinner ? plannerFields.dinner.value : "20:00";
    const workoutPref = plannerFields.workoutPref ? plannerFields.workoutPref.value : "Morning";
    const workoutTime = plannerFields.workoutTime ? plannerFields.workoutTime.value : "";

    const study = Number(plannerFields.study.value) || 0;
    let fitness = Number(plannerFields.fitness.value) || 0;
    const work = Number(plannerFields.work.value) || 0;
    const personal = Number(plannerFields.personal.value) || 0;

    // Default fitness to 60 minutes if they entered a time but left minutes blank
    if (workoutTime && workoutTime !== "" && fitness === 0) {
        fitness = 60;
    }

    if (!wake || !sleep) {
        errorMessage.textContent = "Please fill the wake up time and sleep time.";
        return;
    }
    if (study < 0 || fitness < 0 || work < 0 || personal < 0) {
        errorMessage.textContent = "Values should not be negative.";
        return;
    }

    let wakeMinutes = timeToMinutes(wake);
    let sleepMinutes = timeToMinutes(sleep);
    if (sleepMinutes < wakeMinutes) {
        sleepMinutes = sleepMinutes + 24 * 60;
    }

    let lunchMins = timeToMinutes(lunch);
    if (lunchMins < wakeMinutes) lunchMins += 24 * 60;

    let dinnerMins = timeToMinutes(dinner);
    if (dinnerMins < wakeMinutes) dinnerMins += 24 * 60;

    const routine = { wake, sleep, lunch, dinner, workoutPref, study, fitness, work, personal };

    // Step 2: Establish "Fixed Anchors"
    let fixedBlocks = [];
    fixedBlocks.push({ name: "Morning Routine", start: wakeMinutes, end: wakeMinutes + 60 });
    fixedBlocks.push({ name: "Lunch", start: lunchMins, end: lunchMins + 60 });
    fixedBlocks.push({ name: "Dinner", start: dinnerMins, end: dinnerMins + 60 });

    // Step 3: Place the Workout based on preference
    if (fitness > 0) {
        if (workoutTime && workoutTime !== "") {
            let startTime = timeToMinutes(workoutTime);
            if (startTime < wakeMinutes) {
                startTime += 24 * 60;
            }
            fixedBlocks.push({ name: "Workout", start: startTime, end: startTime + fitness });
        } else {
            if (workoutPref === "Morning") {
                let start = wakeMinutes + 60;
                fixedBlocks.push({ name: "Workout", start: start, end: start + fitness });
            } else {
                let start = dinnerMins - fitness;
                fixedBlocks.push({ name: "Workout", start: start, end: dinnerMins });
            }
        }
    }

    // Sort fixed blocks chronologically
    fixedBlocks.sort((a, b) => a.start - b.start);

    // Step 4: Find the "Empty Gaps" in the day
    let gaps = [];
    let currentTime = wakeMinutes;

    for (let block of fixedBlocks) {
        if (currentTime < block.start) {
            gaps.push({ start: currentTime, end: block.start, duration: block.start - currentTime });
        }
        if (currentTime < block.end) {
            currentTime = block.end;
        }
    }

    if (currentTime < sleepMinutes) {
        gaps.push({ start: currentTime, end: sleepMinutes, duration: sleepMinutes - currentTime });
    }

    // Step 5: Fill the Gaps
    let flexibleTasks = [
        { name: "Study", timeLeft: study * 60 },
        { name: "Work", timeLeft: work * 60 },
        { name: "Personal", timeLeft: personal * 60 }
    ];

    let finalSchedule = [...fixedBlocks];

    for (let gap of gaps) {
        let currentGapStart = gap.start;
        let gapTimeLeft = gap.duration;

        for (let task of flexibleTasks) {
            if (task.timeLeft > 0 && gapTimeLeft > 0) {
                let timeToSpend = Math.min(task.timeLeft, gapTimeLeft);

                finalSchedule.push({
                    name: task.name,
                    start: currentGapStart,
                    end: currentGapStart + timeToSpend
                });

                task.timeLeft -= timeToSpend;
                gapTimeLeft -= timeToSpend;
                currentGapStart += timeToSpend;
            }
        }
    }

    // Step 6: Finalize
    finalSchedule.sort((a, b) => a.start - b.start);

    const generatedSchedule = [];
    let idCounter = 1;
    for (let block of finalSchedule) {
        if (block.end > block.start) {
            generatedSchedule.push({
                id: Date.now() + idCounter,
                label: block.name,
                startTime: minutesToTimeInput(block.start),
                endTime: minutesToTimeInput(block.end),
                startMins: block.start,
                endMins: block.end
            });
            idCounter++;
        }
    }

    appData.tasks.routine = routine;
    appData.tasks.generatedSchedule = generatedSchedule;

    saveData();
    renderAll();
    errorMessage.textContent = "";
}



function handletodoadd() {
    const title = document.getElementById("taskTitle");
    const priority = document.getElementById("taskPriority");
    const deadline = document.getElementById("taskDeadline");
    const status = document.getElementById("taskStatus");

    if (!title || !title.value.trim()) {
        errorMessage.textContent = "This should not be empty";
        return;
    }

    let todo = {
        id: Date.now(),
        title: title.value.trim(),
        priority: priority.value,
        deadline: deadline.value,
        status: status.value

    };
    appData.tasks.todos.push(todo);
    errorMessage.textContent = "";
    title.value = "";
    priority.value = "low";
    deadline.value = "";
    status.value = "todo";
    saveData();
    rendertodos();
}
function rendertodos() {
    const todolist = document.querySelector(".todo-list");

    if (!todolist) {
        errorMessage.textContent = "List is not present in the container";
        return;
    }

    if (appData.tasks.todos.length === 0) {
        todolist.innerHTML = "<p>No tasks yet.</p>";
        return;
    }

    todolist.innerHTML = appData.tasks.todos
        .map((todo) => `
        <div class="list-item">
            <h4>${todo.title}</h4>
            <p>Priority: ${todo.priority}</p>
            <p>Deadline: ${todo.deadline || "No deadline"}</p>
            <p>Status: ${todo.status}</p>
             <div style="margin-top: 20px; margin-left:10px;">
                <button onclick="marktaskdone(${todo.id})" class="action-btn">✔ Done</button>
                <button onclick="deletetask(${todo.id})" class="action-btn delete">🗑 Delete</button>
            </div>
        </div>
    `)
        .join("");



}
function handlefitnessadd() {
    const calories = document.getElementById("calories");
    const protein = document.getElementById("protein");
    const carbs = document.getElementById("carbs");
    const fats = document.getElementById("fats");

    if (!calories.value || !protein.value || !carbs.value || !fats.value) {
        fitnessMessage.textContent = "Please fill all nutrition fields.";
        return;
    }
    let fitnesslog = {
        id: Date.now(),
        calories: calories.value,
        protein: protein.value,
        carbs: carbs.value,
        fats: fats.value
    };
    appData.fitnessLogs.push(fitnesslog);
    fitnessMessage.textContent = "";
    calories.value = "";
    protein.value = "";
    carbs.value = "";
    fats.value = "";
    saveData();
    renderfitness();
}
function renderfitness() {
    const fitnessContainer = document.querySelector(".fitness-list");

    if (!fitnessContainer) {
        fitnessMessage.textContent = "Fitness list container is not present.";
        return;
    }

    if (appData.fitnessLogs.length === 0) {
        fitnessContainer.innerHTML = "<p>No fitness logs yet.</p>";
        return;
    }

    fitnessContainer.innerHTML = "";

    appData.fitnessLogs.forEach((log) => {
        const fitnessItem = document.createElement("div");
        fitnessItem.className = "list-item";

        fitnessItem.innerHTML = `
            <h4>Nutrition Log</h4>
            <p>Calories: ${log.calories}</p>
            <p>Protein: ${log.protein} g</p>
            <p>Carbs: ${log.carbs} g</p>
            <p>Fats: ${log.fats} g</p>
             <div style="margin-top: 20px; margin-left:10px;">
                <button onclick="markfitnesdone(${log.id})" class="action-btn">✔ Done</button>
                <button onclick="deletefitness(${log.id})" class="action-btn delete">🗑 Delete</button>
            </div>
        `;

        fitnessContainer.appendChild(fitnessItem);
    });


}


function handletoworkoutAdd() {
    const exerciseName = document.getElementById("exerciseName");
    const sets = document.getElementById("sets");
    const reps = document.getElementById("reps");
    const weight = document.getElementById("weight");

    if (!exerciseName.value.trim() || !sets.value || !reps.value || !weight.value) {
        workoutMessage.textContent = "Please fill all workout fields.";
        return;
    }

    const workoutLog = {
        id: Date.now(),
        exerciseName: exerciseName.value.trim(),
        sets: sets.value,
        reps: reps.value,
        weight: weight.value
    };

    appData.workout.push(workoutLog);
    workoutMessage.textContent = "";
    exerciseName.value = "";
    sets.value = "";
    reps.value = "";
    weight.value = "";
    saveData();
    renderWorkout();
}

function renderWorkout() {
    const workoutList = document.querySelector(".workout-list");

    if (!workoutList) {
        workoutMessage.textContent = "Workout list container is not present.";
        return;
    }

    if (appData.workout.length === 0) {
        workoutList.innerHTML = "<p>No exercises added yet.</p>";
        return;
    }

    workoutList.innerHTML = appData.workout
        .map((item) => `
        <div class="list-item">
            <h4>${item.exerciseName}</h4>
            <p>Sets: ${item.sets}</p>
            <p>Reps: ${item.reps}</p>
            <p>Weight: ${item.weight} kg</p>
            <div style="margin-top: 15px;">
                <button onclick="markworkoutdone(${item.id})" class="action-btn">✔ Done</button>
                <button onclick="deleteoworkout(${item.id})" class="action-btn delete">🗑 Delete</button>
            </div>
        </div>
    `)
        .join("");



}


function minutesToTimeInput(mins) {
    let h = Math.floor(mins / 60) % 24;
    let m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function renderSchedule() {
    if (!scheduleList) {
        return;
    }
    if (appData.tasks.generatedSchedule.length === 0) {
        scheduleList.innerHTML = "<p> Your generated routine will appear here. </p>";
        return;
    }

    // Generate a timeline from wake to sleep
    let wakeMins = timeToMinutes(appData.tasks.routine.wake || "06:00");
    let sleepMins = timeToMinutes(appData.tasks.routine.sleep || "22:00");
    if (sleepMins < wakeMins) sleepMins += 24 * 60;

    let html = `
        <div class="paper-schedule">
            <h2>TODAY'S SCHEDULE</h2>
            <div class="timeline-grid">
    `;

    for (let m = wakeMins; m <= sleepMins; m += 60) {
        let timeStr = minutesToTimeInput(m);
        // Find if a task starts within this hour
        let matchingTask = appData.tasks.generatedSchedule.find(t => {
            let tStart = t.startMins !== undefined ? t.startMins : timeToMinutes(t.startTime);
            if (tStart < wakeMins && tStart < 12 * 60 && m >= 24 * 60) tStart += 24 * 60;
            return tStart >= m && tStart < m + 60;
        });

        let label = "";
        if (matchingTask) {
            let tStart = matchingTask.startMins !== undefined ? matchingTask.startMins : timeToMinutes(matchingTask.startTime);
            let tEnd = matchingTask.endMins !== undefined ? matchingTask.endMins : timeToMinutes(matchingTask.endTime);
            if (tEnd < tStart) tEnd += 24 * 60;

            let diff = (tEnd - tStart) / 60;
            label = matchingTask.label;
            // Round to 1 decimal place to prevent floating point issues like "1.500000000002 hr"
            if (diff > 0) {
                label += ` (${Math.round(diff * 10) / 10} hr)`;
            }
        }

        html += `
            <div class="timeline-row">
                <div class="timeline-time">${timeStr}</div>
                <div class="timeline-line">
                    <input type="text" class="timeline-task" value="${label}" placeholder="">
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    scheduleList.innerHTML = html;
}


function deletetask(todolist) {
    appData.tasks.todos = appData.tasks.todos.filter(task => task.id !== todolist);
    saveData();
    rendertodos();
    renderDashboard();
}
function marktaskdone(todolist) {
    for (let task of appData.tasks.todos) {
        if (task.id === todolist) {
            task.status = "done";

        }
    }
    saveData();
    renderDashboard();
    rendertodos();
}
function deleteoworkout(workoutList) {
    appData.workout = appData.workout.filter(workout => workout.id !== workoutList);
    saveData();
    renderWorkout();
    renderDashboard();
}
function markworkoutdone(workoutList) {
    for (let task of appData.workout) {
        if (task.id === workoutList) {
            task.status = "done";

        }
    }
    saveData();
    renderWorkout();
    renderDashboard();
}
function deletefitness(fitnessContainer) {
    appData.fitnessLogs = appData.fitnessLogs.filter(fitnessLogs => fitnessLogs.id !== fitnessContainer);
    saveData();
    renderfitness();
    renderDashboard();
}
function markfitnessdone(fitnessContainer) {
    for (let task of appData.fitnessLogs) {
        if (task.id === fitnessContainer) {
            task.status = "done";

        }
    }
    saveData();
    renderfitness();
    renderDashboard();
}

window.deletetask = deletetask;
window.marktaskdone = marktaskdone;
window.deleteoworkout = deleteoworkout;
window.markworkoutdone = markworkoutdone;
window.deletefitness = deletefitness;
window.markfitnessdone = markfitnessdone;
function renderAll() {
    renderSchedule();
    rendertodos();
    renderfitness();
    renderWorkout();
}
function init() {
    loadData();
    bindEvents();
    renderAll();
    showView(appData.settings.activeView || initialView);
}
init();

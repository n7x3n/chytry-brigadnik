import { wageCalculator } from './calc_engine.js';
import { saveJobs, loadJobs } from './storage.js';
//mapping variables
const addBtn = document.getElementById('add-btn');
const cnlBtn = document.getElementById('cancel-btn');
const jobForm = document.getElementById('job-form');
const addShiftBtn = document.getElementById('add-shift-btn');
const cnlShiftBtn = document.getElementById('close-shift-btn');
const shiftForm = document.getElementById('shift-form');
let currentJobId = null;
//

//functions
function renderJobs(jobs) {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '';
    let html = '';
    if (jobs.length === 0) {
        html = `<p>Žádné práce nebyly doposud vytvořeny. 
        Práce lze vytvořit kliknutím na tlačítko v pravém horním rohu.</p>`
        dashboard.innerHTML = html;
        return;
    }
    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
        <h3>${job.config.jobName}</h3>
        <p style="color: #22c55e; font-weight: bold;">${job.config.jobRate} Kč/h</p>
        `;
        card.addEventListener('click', () => openJobDetail(job));
        dashboard.appendChild(card);
    });
}
function openJobDetail(job) {
    currentJobId = job.id;
    document.getElementById('detail-title').innerText = job.config.jobName;
    document.getElementById('detail-rate').innerText = `${job.config.jobRate} Kč/h`;
    document.getElementById('detail-modal').showModal();
    document.getElementById('close-detail-btn').addEventListener('click', () => {
        document.getElementById('detail-modal').close();
    });
}
//

addBtn.addEventListener('click', () => {
    document.getElementById('job-modal').showModal();
})

cnlBtn.addEventListener('click', () => {
    document.getElementById('job-modal').close();
})

jobForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('job-name').value || 0;
    const rate = parseFloat(document.getElementById('job-rate').value) || 0;
    const taxPayer = document.getElementById('tax-payer').checked;
    const isInv12 = document.getElementById('inv-1-2').checked;
    const isInv3 = document.getElementById('inv-3').checked;
    const isZtp = document.getElementById('ztp').checked;
    const kidsCount = parseInt(document.getElementById('kids-count').value) || 0;
    const newJob = {
        id: Date.now(),
        config: {
            jobName: name,
            jobRate: rate,
            taxPayer: taxPayer,
            inv12: isInv12,
            inv3: isInv3,
            ztp: isZtp,
            kidsCount: kidsCount,
        },
        shifts: []
    }
    let jobs = await loadJobs();
    jobs.push(newJob);
    await saveJobs(jobs);
    document.getElementById('job-modal').close();
    jobForm.reset();
    console.log("data successfuly stored")
    renderJobs(jobs);
})
addShiftBtn.addEventListener('click', () => {
    document.getElementById('shift-modal').showModal();
})

cnlShiftBtn.addEventListener('click', () => {
    document.getElementById('shift-modal').close();
})
shiftForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    let jobs = await loadJobs();
    const targetJob = jobs.find(j => j.id === currentJobId);
    const shiftDate = document.getElementById('shift-date').value;
    const clockIn = document.getElementById('clock-in-input').value;
    const clockOut = document.getElementById('clock-out-input').value;
    const shiftNote = document.getElementById('shift-note').value || "žádná poznámka";
    if (targetJob) {
        const newShift = {
            id: Date.now(),
            jobrate: targetJob.config.jobRate,
            shiftDate: shiftDate,
            clockIn: clockIn,
            clockOut: clockOut,
            shiftNote: shiftNote
        }
        targetJob.shifts.push(newShift);
        await saveJobs(jobs);
        document.getElementById('shift-modal').close();
        shiftForm.reset();
    }
    console.log("Shift has been successfully saved");
})
async function initApp() {
    const jobs = await loadJobs();
    renderJobs(jobs);
}
initApp();
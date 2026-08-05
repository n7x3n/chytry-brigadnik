import { wageCalculator, shiftHours } from './calc_engine.js';
import { saveJobs, loadJobs } from './storage.js';
//mapping variables
const addBtn = document.getElementById('add-btn');
const cnlBtn = document.getElementById('cancel-btn');
const jobForm = document.getElementById('job-form');
const addShiftBtn = document.getElementById('add-shift-btn');
const cnlShiftBtn = document.getElementById('close-shift-btn');
const shiftForm = document.getElementById('shift-form');
const shiftList = document.getElementById('show-shift-list');
const cnlShiftList = document.getElementById('back-to-overview-btn');
let currentJobId = null;
let editingShiftId = null;
const deleteJobBtn = document.getElementById('delete-job-btn');
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
function editShift(shift) {
    editingShiftId = shift.id
    document.getElementById('shift-date').value = shift.shiftDate;
    document.getElementById('clock-in-input').value = shift.clockIn;
    document.getElementById('clock-out-input').value = shift.clockOut;
    document.getElementById('shift-note').value = shift.shiftNote;
    document.getElementById('shift-modal-title').innerText = "Upravit směnu";
    document.getElementById('shift-modal').showModal();
}
function renderShiftList(job) {
    const container = document.getElementById('shift-list-container');
    container.innerHTML = ``
    if (!job.shifts || job.shifts.length === 0) {
        container.innerHTML = `<p style="color: #71717a; text-align: center; margin-top: 20px;">
        Zatím žádné odpracované směny.</p >`;
        return;
    }
    job.shifts.forEach(shift => {
        const hours = shiftHours(shift.clockIn, shift.clockOut);
        const pay = Math.ceil(hours * shift.jobrate);
        const card = document.createElement('div');
        card.style.cssText = `background: #18181b; border: 1px solid #27272a; border-radius: 10px;
        padding: 12px; margin - bottom: 10px; display: flex; justify-content: space-between; align-items: center;
        `;
        card.innerHTML = `
                <div>
                    <strong>${shift.shiftDate}</strong> <small>(${shift.clockIn} - ${shift.
                clockOut})</small>
                    <br>
                    <span style="color: #22c55e; font-weight: bold;">+${pay} Kč</span> (${hours} h)
                    <br>
                    <small style="color: #a1a1aa;">📝 ${shift.shiftNote}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="edit-shift-btn" style="background: #27272a; border: none; color: white; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
                    ✏️
                    </button>
                    <button type="button" class="del-shift-btn" style="background: #ef4444; border: none; color: white; padding: 6px 10px; border-radius: 6px; cursor: pointer;">
                    🗑️
                    </button>
                </div>`;
        //editing shift button
        const editBtn = card.querySelector('.edit-shift-btn');
        editBtn.addEventListener('click', () => editShift(shift));
        //deleting shift button
        const delBtn = card.querySelector('.del-shift-btn');
        delBtn.addEventListener('click', () => deleteShift(shift.id));
        container.appendChild(card);
    });
}
async function deleteShift(shiftId) {
    let jobs = await loadJobs();
    const targetJob = jobs.find(j => j.id === currentJobId);
    if (targetJob) {
        targetJob.shifts = targetJob.shifts.filter(s => s.id !== shiftId);
        await saveJobs(jobs);
        renderShiftList(targetJob);
        console.log("Shift successfully deleted.");
    }
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
    editingShiftId = null;
    shiftForm.reset();
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
    const hours = shiftHours(clockIn, clockOut);
    const shiftNote = document.getElementById('shift-note').value || "žádná poznámka";
    if (targetJob) {
        if (editingShiftId) {
            const existing = targetJob.shifts.find(s => s.id === editingShiftId);
            if (existing) {
                existing.shiftDate = shiftDate;
                existing.clockIn = clockIn;
                existing.clockOut = clockOut;
                existing.hours = hours;
                existing.shiftNote = shiftNote;
            }
        } else {
            const newShift = {
                id: Date.now(),
                jobrate: targetJob.config.jobRate,
                shiftDate: shiftDate,
                clockIn: clockIn,
                clockOut: clockOut,
                hours: hours,
                shiftNote: shiftNote
            };
            targetJob.shifts.push(newShift);
        }
        await saveJobs(jobs);
        renderShiftList(targetJob);
        document.getElementById('shift-modal').close();
        shiftForm.reset();
        editingShiftId = null;
    }
    console.log("Shift has been successfully saved");
})
shiftList.addEventListener('click', async () => {
    document.getElementById('detail-overview').style.display = 'none';
    document.getElementById('shift-list').style.display = 'block';
    let jobs = await loadJobs();
    const activeJob = jobs.find(j => j.id === currentJobId);
    if (activeJob) {
        renderShiftList(activeJob);
    }
});
cnlShiftList.addEventListener('click', () => {
    document.getElementById('shift-list').style.display = 'none';
    document.getElementById('detail-overview').style.display = 'block';
});
deleteJobBtn.addEventListener('click', async () => {
    if (!currentJobId) return;
    const confirmDelete = confirm("Opravdu chcete smazat tuto práci včetně všech směn?");
    if (!confirmDelete) return;
    let jobs = await loadJobs();
    jobs = jobs.filter(j => j.id !== currentJobId);
    await saveJobs(jobs);
    document.getElementById('detail-modal').close();
    renderJobs(jobs);
    console.log("Práce byla úspěšně smazána");
});
async function initApp() {
    const jobs = await loadJobs();
    renderJobs(jobs);
}
initApp();
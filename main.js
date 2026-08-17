import { wageCalculator, shiftHours } from './calc_engine.js';
import { saveJobs, loadJobs } from './storage.js';
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/dark.css';
import { Czech } from 'flatpickr/dist/l10n/cs.js';
try {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#18181b' });
} catch (e) {
}
//mapping variables
const addBtn = document.getElementById('add-btn');
const cnlBtn = document.getElementById('cancel-btn');
const jobForm = document.getElementById('job-form');
const addShiftBtn = document.getElementById('add-shift-btn');
const cnlShiftBtn = document.getElementById('close-shift-btn');
const shiftForm = document.getElementById('shift-form');
const shiftList = document.getElementById('show-shift-list');
const cnlShiftList = document.getElementById('back-to-overview-btn');
const importJsonBtn = document.getElementById('import-json-btn');
const importFileInput = document.getElementById('import-file-input');
let currentJobId = null;
let editingShiftId = null;
const deleteJobBtn = document.getElementById('delete-job-btn');
// getting date and month
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
// array of Months
const MONTH_NAMES = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];
const CZECH_DAYS = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
const CZECH_MONTHS_GENITIVE = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince"
];
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const openDataSettingsBtn = document.getElementById('open-data-settings-btn');
const backToSettingsBtn = document.getElementById('back-to-settings-btn');
const settingsMainView = document.getElementById('settings-main-view');
const settingsDataView = document.getElementById('settings-data-view');
const exportJsonBtn = document.getElementById('export-json-btn');
const shiftDatePicker = flatpickr("#shift-date", {
    locale: Czech,
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "j. F Y",
    defaultDate: "today",
    disableMobile: true,
    static: true
});
const clockInInput = document.getElementById('clock-in-input');
const clockOutInput = document.getElementById('clock-out-input');
setupTimeInput(clockInInput, "08:00");
setupTimeInput(clockOutInput, "16:00");
let editingJobId = null;
const editJobBtn = document.getElementById('edit-job-btn');
const jobModalTitle = document.getElementById('job-modal-title');
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
async function openJobDetail(job) {
    currentJobId = job.id;
    document.getElementById('detail-title').innerText = job.config.jobName;
    document.getElementById('detail-rate').innerText = `${job.config.jobRate} Kč/h`;
    await updateMonthView();
    document.getElementById('detail-modal').showModal();
    document.getElementById('close-detail-btn').addEventListener('click', () => {
        document.getElementById('detail-modal').close();
    });
}
function editShift(shift) {
    editingShiftId = shift.id
    shiftDatePicker.setDate(shift.shiftDate);
    document.getElementById('clock-in-input').value = shift.clockIn;
    document.getElementById('clock-out-input').value = shift.clockOut;
    document.getElementById('shift-note').value = shift.shiftNote;
    document.getElementById('shift-modal-title').innerText = "Upravit směnu";
    document.getElementById('shift-modal').showModal();
}
function renderShiftList(job) {
    const container = document.getElementById('shift-list-container');
    container.innerHTML = '';
    if (!job.shifts || job.shifts.length === 0) {
        container.innerHTML = `<p style="color: #71717a; text-align: center; margin-top: 30px;">Zatím žádné odpracované směny.</p>`;
        return;
    }
    const sortedShifts = [...job.shifts].sort((a, b) => new Date(b.shiftDate) - new Date(a.
        shiftDate));
    let currentGroup = '';
    sortedShifts.forEach(shift => {
        const [y, m, d] = shift.shiftDate.split('-').map(Number);
        const groupKey = `${y}-${m}`;
        const shiftDateObj = new Date(y, m - 1, d);
        if (groupKey !== currentGroup) {
            currentGroup = groupKey;
            const monthTitle = `${MONTH_NAMES[m - 1]} ${y}`;
            const headerEl = document.createElement('div');
            headerEl.style.cssText = 'margin-top: 24px; margin-bottom: 12px;';
            headerEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.05rem; color: #f4f4f5; font-weight: 700;">${monthTitle}</h4>
                    </div>
                    <hr style="border: none; border-top: 1px solid #27272a; margin-top: 8px; margin-bottom: 12px;">
                `;
            container.appendChild(headerEl);
        }
        const hours = shiftHours(shift.clockIn, shift.clockOut);
        const pay = Math.ceil(hours * shift.jobrate);
        const formattedDate = `${d}. ${CZECH_MONTHS_GENITIVE[m - 1]} ${y}`;
        const dayName = CZECH_DAYS[shiftDateObj.getDay()];
        const card = document.createElement('div');
        card.style.cssText = `
                background: #18181b;
                border: 1px solid #27272a;
                border-radius: 12px;
                padding: 14px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
        const noteHtml = (shift.shiftNote && shift.shiftNote !== "žádná poznámka")
            ? `<div style="color: #a1a1aa; font-size: 0.85rem; margin-top: 4px;">📝 ${shift.
                shiftNote}</div>`
            : '';
        card.innerHTML = `
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <strong style="color: #f4f4f5; font-size: 0.95rem;">${formattedDate}</strong>
                        <span style="background: #27272a; color: #a1a1aa; font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${dayName}</span>
                    </div>
                    <div style="color: #71717a; font-size: 0.85rem;">
                        🕒 ${shift.clockIn} – ${shift.clockOut} (${hours} h)
                    </div>
                    <div style="color: #22c55e; font-weight: bold; font-size: 1.05rem; margin-top: 4px;">
                        +${pay.toLocaleString('cs-CZ')} Kč
                    </div>
                    ${noteHtml}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="edit-shift-btn" style="background: #27272a; border: 1px solid #3f3f46; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer;">
                        ✏️
                    </button>
                    <button type="button" class="del-shift-btn" style="background: #ef4444; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            `;
        card.querySelector('.edit-shift-btn').addEventListener('click', () => editShift(shift));
        card.querySelector('.del-shift-btn').addEventListener('click', () => deleteShift(shift.id));
        container.appendChild(card);
    });
}
function confDelModal(confString, okText = "Smazat") {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const text = document.getElementById('confirm-modal-text');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        if (text) text.innerText = confString || "Opravdu si přejete tuto položku smazat?";
        if (okBtn) okBtn.innerText = okText;
        modal.showModal();
        okBtn.onclick = () => {
            modal.close();
            resolve(true);
        };
        cancelBtn.onclick = () => {
            modal.close();
            resolve(false);
        };
    });
}
async function deleteShift(shiftId) {
    let jobs = await loadJobs();
    const targetJob = jobs.find(j => j.id === currentJobId);
    if (targetJob) {
        targetJob.shifts = targetJob.shifts.filter(s => s.id !== shiftId);
        await saveJobs(jobs);
        renderShiftList(targetJob);
        await updateMonthView()
        console.log("Shift successfully deleted.");
    }
}
async function updateMonthView() {
    let jobs = await loadJobs();
    const activeJob = jobs.find(j => j.id === currentJobId);
    if (!activeJob) return;
    document.getElementById('current-month-display').innerText = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    renderSummaryTable(activeJob);
    renderCalendar(activeJob);
}
function renderSummaryTable(job) {
    const container = document.getElementById('detail-summary-table');
    if (!container) return;
    const monthlyShifts = job.shifts.filter(shift => {
        const [y, m, d] = shift.shiftDate.split('-').map(Number);
        return y === currentYear && (m - 1) === currentMonth;
    });
    const totalHours = monthlyShifts.reduce((sum, shift) => sum + shift.hours, 0);
    const totalGross = Math.ceil(totalHours * job.config.jobRate);
    container.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Odpracované hodiny:</span>
                <strong>${totalHours} h</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #22c55e;">
                <span>Odhadovaná mzda:</span>
                <strong>${totalGross} Kč</strong>
            </div>
        `;
}
function renderCalendar(job) {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const jsDay = new Date(currentYear, currentMonth, 1).getDay();
    const firstDayIndex = (jsDay === 0) ? 6 : jsDay - 1;
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'calendar-empty-box';
        grid.appendChild(emptyBox);
    }
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const targetDate = `${currentYear}-${monthStr}-${dayStr}`;
        const hasShift = job.shifts && job.shifts.some(shift => shift.shiftDate === targetDate);
        const box = document.createElement('div');
        box.className = 'calendar-day-box' + (hasShift ? ' worked' : '');
        box.innerText = day;
        grid.appendChild(box);
    }
}
function showAlert(title, message) {
    const modal = document.getElementById('alert-modal');
    const modalTitle = document.getElementById('alert-modal-title');
    const text = document.getElementById('alert-modal-text');
    const btn = document.getElementById('alert-modal-btn');
    if (modalTitle) modalTitle.innerText = title;
    if (text) text.innerText = message;
    modal.showModal();
    btn.onclick = () => {
        modal.close();
    };
}
function setupTimeInput(inputElement, defaultValue = "08:00") {
    inputElement.value = defaultValue;
    inputElement.addEventListener('focus', (e) => {
        setTimeout(() => e.target.select(), 50);
    });
    inputElement.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        if (val.length === 1 && parseInt(val, 10) > 2) {
            e.target.value = `0${val}:`;
            return;
        }
        if (val.length >= 2) {
            let hours = parseInt(val.slice(0, 2), 10);
            if (hours > 23) hours = 23;
            const hoursStr = String(hours).padStart(2, '0');
            if (val.length > 2) {
                let mins = parseInt(val.slice(2), 10);
                if (mins > 59) mins = 59;
                const minsStr = val.slice(2).length === 2 ? String(mins).padStart(2, '0') : val.
                    slice(2);
                e.target.value = `${hoursStr}:${minsStr}`;
            } else {
                e.target.value = `${hoursStr}:`;
            }
        } else {
            e.target.value = val;
        }
    });
    inputElement.addEventListener('blur', (e) => {
        let val = e.target.value.trim();
        if (!val) {
            e.target.value = defaultValue;
            return;
        }
        const digits = val.replace(/\D/g, '');
        if (digits.length === 1) {
            e.target.value = `0${digits}:00`;
        } else if (digits.length === 2) {
            let h = String(Math.min(23, parseInt(digits, 10) || 0)).padStart(2, '0');
            e.target.value = `${h}:00`;
        } else if (digits.length === 3) {
            let h = String(Math.min(23, parseInt(digits[0], 10) || 0)).padStart(2, '0');
            let m = String(Math.min(59, parseInt(digits.slice(1), 10) || 0)).padStart(2, '0');
            e.target.value = `${h}:${m}`;
        } else {
            let h = String(Math.min(23, parseInt(digits.slice(0, 2), 10) || 0)).padStart(2, '0');
            let m = String(Math.min(59, parseInt(digits.slice(2), 10) || 0)).padStart(2, '0');
            e.target.value = `${h}:${m}`;
        }
    });
}
//

addBtn.addEventListener('click', () => {
    editingJobId = null;
    jobForm.reset();
    if (jobModalTitle) jobModalTitle.innerText = "Nová práce / brigáda";
    document.getElementById('job-modal').showModal();
})

cnlBtn.addEventListener('click', () => {
    const jobModal = document.getElementById('job-modal');
    jobModal.classList.add('closing');
    setTimeout(() => {
        jobModal.close();
        jobModal.classList.remove('closing');
    }, 250);
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
    let jobs = await loadJobs();
    if (editingJobId) {
        const targetJob = jobs.find(j => j.id === editingJobId);
        if (targetJob) {
            targetJob.config = {
                jobName: name,
                jobRate: rate,
                taxPayer: taxPayer,
                inv12: isInv12,
                inv3: isInv3,
                ztp: isZtp,
                kidsCount: kidsCount
            };
            document.getElementById('detail-title').innerText = name;
            document.getElementById('detail-rate').innerText = `${rate} Kč/h`;
            await updateMonthView();
        }
        editingJobId = null;
    } else {
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
        };
        jobs.push(newJob);
    }



    await saveJobs(jobs);
    document.getElementById('job-modal').close();
    jobForm.reset();
    console.log("data successfuly stored")
    renderJobs(jobs);
})
addShiftBtn.addEventListener('click', () => {
    editingShiftId = null;
    shiftForm.reset();

    shiftDatePicker.setDate(new Date());
    document.getElementById('clock-in-input').value = "08:00";
    document.getElementById('clock-out-input').value = "16:00";
    document.getElementById('shift-modal-title').innerText = "Přidat Směnu";
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
        await updateMonthView()
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
    const confirmDelete = await confDelModal();
    if (!confirmDelete) return;
    let jobs = await loadJobs();
    jobs = jobs.filter(j => j.id !== currentJobId);
    await saveJobs(jobs);
    document.getElementById('detail-modal').close();
    renderJobs(jobs);
    console.log("Práce byla úspěšně smazána");
});
prevMonthBtn.addEventListener('click', async () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    await updateMonthView();
});
nextMonthBtn.addEventListener('click', async () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    await updateMonthView();
});
settingsBtn.addEventListener('click', () => {
    document.getElementById('settings-modal').showModal();
});

closeSettingsBtn.addEventListener('click', () => {
    const settingsModal = document.getElementById('settings-modal');
    settingsModal.classList.add('closing');
    setTimeout(() => {
        settingsModal.close();
        settingsModal.classList.remove('closing');
    }, 250);
});
openDataSettingsBtn.addEventListener('click', () => {
    settingsMainView.style.display = 'none';
    settingsDataView.style.display = 'block';
    settingsDataView.classList.add('slide-in-subview');
});

backToSettingsBtn.addEventListener('click', () => {
    settingsDataView.style.display = 'none';
    settingsMainView.style.display = 'block';
});
exportJsonBtn.addEventListener('click', async () => {
    try {
        const content = await loadJobs();
        const data = JSON.stringify(content, null, 2);
        const fileName = `chytry-brigadnik-export-${new Date().toISOString().split('T')[0]}.json`;

        await Filesystem.writeFile({
            path: fileName,
            data: data,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });

        console.log("Soubor byl přímo uložen do složky Dokumenty.");
        showAlert("Záloha uložena!", `Soubor ${fileName} byl úspěšně uložen do složky Dokumenty ve vašem telefonu.`);
    } catch (err) {
        console.error("Chyba při exportu:", err);
        showAlert("Chyba exportu", "Nepodařilo se uložit soubor do úložiště.");
    }
});
importJsonBtn.addEventListener('click', () => {
    importFileInput.click();
});
importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {

        const text = await file.text();
        const importedJobs = JSON.parse(text);
        if (!Array.isArray(importedJobs)) {
            throw new Error("Data nejsou v platném formátu pole.");
        }
        for (const job of importedJobs) {
            if (!job.id || !job.config || !Array.isArray(job.shifts)) {
                throw new Error("Neplatná struktura dat v souboru.");
            }
        }
        let currentJobs = await loadJobs();
        importedJobs.forEach(impJob => {
            const existingJob = currentJobs.find(j => j.id === impJob.id);
            if (existingJob) {
                impJob.shifts.forEach(impShift => {
                    const shiftExists = existingJob.shifts.some(s => s.id === impShift.id);
                    if (!shiftExists) {
                        existingJob.shifts.push(impShift);
                    }
                });
            } else {
                currentJobs.push(impJob);
            }
        });
        await saveJobs(currentJobs);
        renderJobs(currentJobs);
        showAlert("Úspěch!", "Data byla úspěšně importována a sloučena se stávajícími.");
    } catch (err) {
        console.error("Chyba při importu:", err);
        showAlert("Chyba importu", "Vybraný soubor není platná záloha aplikace Chytrý Brigádník!");
    } finally {
        importFileInput.value = "";
        document.getElementById('settings-modal').close();
    }
});
/////

// swipe-to-dismiss on detail-modal
const sheetHandleZone = document.getElementById('sheet-handle-zone')
const detailModal = document.getElementById('detail-modal');
let startY = 0;
let currentY = 0;
let isDragging = false;

sheetHandleZone.addEventListener('touchstart', (e) => {
    if (detailModal.scrollTop === 0) {
        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;
        detailModal.style.transition = 'none';
    }
}, { passive: true });
sheetHandleZone.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    if (deltaY > 0) {
        detailModal.style.transform = `translateY(${deltaY}px)`;
    }
}, { passive: true });
sheetHandleZone.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const deltaY = currentY - startY;
    if (deltaY > 120) {
        detailModal.style.transition = 'transform 0.12s ease-out';
        detailModal.style.transform = 'translateY(100%)';
        setTimeout(() => {
            detailModal.close();
            detailModal.style.transform = '';
            detailModal.style.transition = '';
            const shiftList = document.getElementById('shift-list');
            const detailOverview = document.getElementById('detail-overview');
            if (shiftList) shiftList.style.display = 'none';
            if (detailOverview) detailOverview.style.display = 'block';
        }, 120);
    } else {
        detailModal.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        detailModal.style.transform = 'translateY(0)';
        setTimeout(() => {
            detailModal.style.transition = '';
        }, 200);
    }
});
/////

/////
try {
    App.addListener('backButton', () => {
        const settingsDataView = document.getElementById('settings-data-view');
        const settingsMainView = document.getElementById('settings-main-view');
        if (settingsDataView && settingsDataView.style.display === 'block') {
            settingsDataView.style.display = 'none';
            settingsMainView.style.display = 'block';
            return;
        }
        const shiftList = document.getElementById('shift-list');
        const detailOverview = document.getElementById('detail-overview');
        if (shiftList && shiftList.style.display === 'block') {
            shiftList.style.display = 'none';
            detailOverview.style.display = 'block';
            return;
        }
        const openModals = Array.from(document.querySelectorAll('dialog[open]'));
        if (openModals.length > 0) {
            const topModal = openModals[openModals.length - 1];
            topModal.close();
        } else {
            App.exitApp();
        }
    });
} catch (e) {
}
editJobBtn.addEventListener('click', async () => {
    if (!currentJobId) return;
    const jobs = await loadJobs();
    const currentJob = jobs.find(j => j.id === currentJobId);
    if (!currentJob) return;
    editingJobId = currentJob.id;
    if (jobModalTitle) jobModalTitle.innerText = "Upravit práci";
    document.getElementById('job-name').value = currentJob.config.jobName;
    document.getElementById('job-rate').value = currentJob.config.jobRate;
    document.getElementById('tax-payer').checked = !!currentJob.config.taxPayer;
    document.getElementById('inv-1-2').checked = !!currentJob.config.inv12;
    document.getElementById('inv-3').checked = !!currentJob.config.inv3;
    document.getElementById('ztp').checked = !!currentJob.config.ztp;
    document.getElementById('kids-count').value = currentJob.config.kidsCount || 0;
    document.getElementById('job-modal').showModal();
});

/////

const CURRENT_VERSION = "1.1.0";

async function checkForAppUpdates() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/n7x3n/chytry-brigadnik/main/version.json');
        if (!response.ok) return;
        const remoteData = await response.json();
        const remoteVersion = remoteData.version;
        if (remoteVersion && remoteVersion !== CURRENT_VERSION) {
            const wantsUpdate = await confDelModal(
                `🎉 Je k dispozici nová verze (v${remoteVersion})!\nPřejete si otevřít stránku ke stažení nového APK?`, "otevřít");
            if (wantsUpdate) {
                window.open(remoteData.downloadUrl || 'https://github.com/n7x3n/chytry-brigadnik / releases', '_blank');
            }
        }
    } catch (e) {
        console.log("Kontrola aktualizací přeskočena (offline režim).");
    }
}
async function initApp() {
    const jobs = await loadJobs();
    renderJobs(jobs);
    checkForAppUpdates();
}
initApp();
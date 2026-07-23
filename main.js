import { wageCalculator } from './calc_engine.js';
//mapování
const addBtn = document.getElementById('add-btn');
const cnlBtn = document.getElementById('cancel-btn');
//

addBtn.addEventListener('click', () =>{
    document.getElementById('job-modal').showModal();
})

cnlBtn.addEventListener('click', () =>{
    document.getElementById('job-modal').close();
})
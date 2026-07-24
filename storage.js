import { Preferences } from '@capacitor/preferences';
//saving to json
const JOBS_KEY = 'chytry_brigadnik_jobs';
export async function saveJobs(jobsArray) {
    const string = JSON.stringify(jobsArray);
    await Preferences.set({
        key: JOBS_KEY,
        value: string
    });
}

//loading from json
export async function loadJobs() {
    const { value } = await Preferences.get({ key: JOBS_KEY });
    if (!value) {
        return [];
    }
    return JSON.parse(value);
}
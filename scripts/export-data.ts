import fs from 'fs';
import { news } from '../src/data/news';
import { programs } from '../src/data/programs';
import { facilitiesData } from '../src/data/facilities';
import { staffData } from '../src/data/staff';
import { achievements } from '../src/data/achievements';
import { teacherActivitiesData } from '../src/data/teacherActivities';
import { educationStaffData } from '../src/data/educationStaff';
import { extracurricularsData } from '../src/data/extracurriculars';

const allData = {
    news: news,
    programs: programs,
    facilities: facilitiesData,
    staff: staffData,
    achievements: achievements,
    teacher_activities: teacherActivitiesData,
    education_staff: educationStaffData,
    extracurriculars: extracurricularsData
};

fs.writeFileSync('backend/database/seeders/dummy_data.json', JSON.stringify(allData, null, 2));
console.log('Exported to dummy_data.json');


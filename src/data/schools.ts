export interface School {
    id: string;
    name: string;
    address: string;
    classes: string[];
    teacher?: string;
    teacherPhone?: string;
    notes?: string;
}

export const schools: School[] = [
    {
        id: "1",
        name: "Гимназия № 8",
        address: "Хабаровск, Ул. Тихоокеанская 169А",
        classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"],
        teacher: "Иванова Мария Петровна",
        teacherPhone: "+7 (4212) 123-45-67",
        notes: "Гимназия с углубленным изучением иностранных языков"
    },
    {
        id: "2",
        name: "Школа № 12",
        address: "Хабаровск, Ул. Ленина 45",
        classes: ["1А", "1Б", "2А", "2Б", "3А", "3Б", "4А", "4Б"],
        teacher: "Петрова Анна Сергеевна",
        teacherPhone: "+7 (4212) 234-56-78",
        notes: "Школа с математическим уклоном"
    },
    {
        id: "3",
        name: "Лицей № 3",
        address: "Хабаровск, Ул. Карла Маркса 78",
        classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"],
        teacher: "Сидорова Елена Владимировна",
        teacherPhone: "+7 (4212) 345-67-89",
        notes: "Лицей с естественнонаучным профилем"
    },
    {
        id: "4",
        name: "Детский сад № 15",
        address: "Хабаровск, Ул. Пушкина 23",
        classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"],
        teacher: "Козлова Ольга Николаевна",
        teacherPhone: "+7 (4212) 456-78-90",
        notes: "Детский сад с логопедическими группами"
    },
    {
        id: "5",
        name: "Детский сад № 8",
        address: "Хабаровск, Ул. Гагарина 56",
        classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"],
        teacher: "Морозова Татьяна Александровна",
        teacherPhone: "+7 (4212) 567-89-01",
        notes: "Детский сад с художественно-эстетическим развитием"
    }
];

export const getSchoolById = (id: string): School | undefined => {
    return schools.find(school => school.id === id);
};

export const getClassesBySchoolId = (schoolId: string): string[] => {
    const school = getSchoolById(schoolId);
    return school?.classes || [];
}; 
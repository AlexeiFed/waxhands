/**
 * @file: update-participant-notes.js
 * @description: Миграция для обновления примечаний участников из workshop_registrations
 * @created: 2025-01-09
 */

import pool from '../../database/connection.js';

async function updateParticipantNotes() {
    console.log('🔄 Начинаем обновление примечаний участников...');

    try {
        // Получаем все мастер-классы с участниками
        const masterClassesResult = await pool.query(`
            SELECT id, participants 
            FROM master_class_events 
            WHERE participants IS NOT NULL AND jsonb_array_length(participants) > 0
        `);

        console.log(`📋 Найдено ${masterClassesResult.rows.length} мастер-классов с участниками`);

        let updatedCount = 0;

        for (const masterClass of masterClassesResult.rows) {
            const participants = masterClass.participants;
            let hasUpdates = false;

            // Обновляем каждого участника
            const updatedParticipants = await Promise.all(participants.map(async (participant) => {
                // Проверяем, есть ли технические примечания
                if (participant.notes &&
                    (participant.notes.includes('Групповая регистрация') ||
                        participant.notes.includes('Детская регистрация') ||
                        participant.notes.includes('Счет:') ||
                        participant.notes.includes('Родитель:'))) {

                    console.log(`🔍 Найдены технические примечания для участника ${participant.childName}: ${participant.notes}`);

                    // Ищем реальные примечания в workshop_registrations
                    try {
                        const registrationResult = await pool.query(`
                            SELECT notes 
                            FROM workshop_registrations 
                            WHERE user_id = $1 AND workshop_id = $2 AND notes IS NOT NULL AND notes != ''
                        `, [participant.childId, masterClass.id]);

                        if (registrationResult.rows.length > 0) {
                            const realNotes = registrationResult.rows[0].notes;
                            console.log(`✅ Найдены реальные примечания для ${participant.childName}: ${realNotes}`);
                            hasUpdates = true;
                            return {
                                ...participant,
                                notes: realNotes
                            };
                        } else {
                            console.log(`⚠️ Реальные примечания не найдены для ${participant.childName}`);
                            hasUpdates = true;
                            return {
                                ...participant,
                                notes: null
                            };
                        }
                    } catch (error) {
                        console.error(`❌ Ошибка поиска примечаний для ${participant.childName}:`, error);
                        return participant;
                    }
                }
                return participant;
            }));

            // Если есть изменения, обновляем мастер-класс
            if (hasUpdates) {
                await pool.query(`
                    UPDATE master_class_events 
                    SET participants = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [JSON.stringify(updatedParticipants), masterClass.id]);

                updatedCount++;
                console.log(`✅ Обновлен мастер-класс ${masterClass.id}`);
            }
        }

        console.log(`🎯 Обновление завершено: ${updatedCount} мастер-классов обновлено`);

    } catch (error) {
        console.error('❌ Ошибка при обновлении примечаний участников:', error);
        throw error;
    }
}

// Запускаем миграцию
updateParticipantNotes()
    .then(() => {
        console.log('✅ Миграция примечаний участников завершена успешно');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка миграции:', error);
        process.exit(1);
    });

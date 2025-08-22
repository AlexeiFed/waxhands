import { Router } from 'express';
import {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    addStyleToService,
    addOptionToService,
    updateServiceStyle,
    updateServiceOption,
    reorderServiceStyles,
    reorderServiceOptions,
    getServiceMedia
} from '../controllers/services.js';

const router = Router();

// Основные маршруты для услуг
router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

// Маршруты для стилей (специфичные маршруты должны идти ДО параметризованных)
router.put('/:id/styles/reorder', reorderServiceStyles);
router.post('/:id/styles', addStyleToService);
router.put('/:id/styles/:styleId', updateServiceStyle);

// Маршруты для опций (специфичные маршруты должны идти ДО параметризованных)
router.put('/:id/options/reorder', reorderServiceOptions);
router.post('/:id/options', addOptionToService);
router.put('/:id/options/:optionId', updateServiceOption);

// Маршрут для получения медиафайлов
router.get('/:serviceId/media', getServiceMedia);

export default router; 
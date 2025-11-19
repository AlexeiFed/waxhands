import { Router } from 'express';
import authRoutes from './auth.js';
import schoolsRoutes from './schools.js';
import usersRoutes from './users.js';
import servicesRoutes from './services.js';
import masterClassesRoutes from './masterClasses.js';
import ordersRoutes from './orders.js';
import uploadRoutes from './upload.js';
import workshopRegistrationsRoutes from './workshopRegistrations.js';
import invoicesRoutes from './invoices.js';
import chatRoutes from './chat.js';
import workshopRequestsRoutes from './workshopRequests.js';
import aboutRoutes from './about.js';
import paymentWebhookRoutes from './payment-webhook.js';
import paymentWebhookDiagnosticRoutes from './payment-webhook-diagnostic.js';
import paymentsRoutes from './payments.js';
import paymentCheckRoutes from './payment-check.js';
import paymentPollerRoutes from './payment-poller.js';
import offersRoutes from './offers.js';
import offersPdfRoutes from './offers-pdf.js';
import contactsRoutes from './contacts.js';
import bonusesRoutes from './bonuses.js';
import robokassaRoutes from './robokassa.js';

const router = Router();

// Основные маршруты
router.use('/auth', authRoutes);
router.use('/schools', schoolsRoutes);
router.use('/users', usersRoutes);
router.use('/services', servicesRoutes);
router.use('/master-classes', masterClassesRoutes);
router.use('/orders', ordersRoutes);
router.use('/upload', uploadRoutes);
router.use('/workshop-registrations', workshopRegistrationsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/chat', chatRoutes);
router.use('/workshop-requests', workshopRequestsRoutes);
router.use('/about', aboutRoutes);
router.use('/payment-webhook', paymentWebhookRoutes);
router.use('/payment-webhook-diagnostic', paymentWebhookDiagnosticRoutes);
router.use('/payments', paymentsRoutes);
router.use('/payment-check', paymentCheckRoutes);
router.use('/payment-poller', paymentPollerRoutes);
router.use('/offers', offersRoutes);
router.use('/offers-pdf', offersPdfRoutes);
router.use('/contacts', contactsRoutes);
router.use('/bonuses', bonusesRoutes);
router.use('/robokassa', robokassaRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Wax Hands API is running',
        timestamp: new Date().toISOString()
    });
});

// API info
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Wax Hands PWA API',
        version: '1.0.0',
        endpoints: {
            auth: '/auth',
            schools: '/schools',
            users: '/users',
            services: '/services',
            'master-classes': '/master-classes',
            orders: '/orders',
            invoices: '/invoices',
            chat: '/chat',
            'workshop-requests': '/workshop-requests',
            payments: '/payments',
            'payment-check': '/payment-check',
            'payment-poller': '/payment-poller',
            offers: '/offers',
            'privacy-policy': '/privacy-policy',
            contacts: '/contacts',
            bonuses: '/bonuses'
        }
    });
});

export default router; 
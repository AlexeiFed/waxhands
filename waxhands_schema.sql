--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: check_sender_exists(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_sender_exists(sender_id uuid, sender_type character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
            BEGIN
                -- Если отправитель - админ, проверка не нужна
                IF sender_type = 'admin' THEN
                    RETURN TRUE;
                END IF;
                
                -- Если отправитель - пользователь, проверяем его существование в таблице users
                IF sender_type = 'user' THEN
                    RETURN EXISTS (SELECT 1 FROM users WHERE id = sender_id);
                END IF;
                
                -- Для других типов отправителей возвращаем FALSE
                RETURN FALSE;
            END;
            $$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: about; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.about (
    id integer NOT NULL,
    title character varying(255) DEFAULT 'О нас'::character varying NOT NULL,
    subtitle character varying(500),
    description text,
    contact_info text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    studio_title character varying(255) DEFAULT 'О нашей студии'::character varying,
    studio_description text DEFAULT 'Студия «МК Восковые ручки» — это место, где рождается магия творчества! Мы специализируемся на создании уникальных 3D-копий рук детей в восковом исполнении.'::text,
    advantages_title character varying(255) DEFAULT 'Наши преимущества'::character varying,
    advantages_list text[] DEFAULT ARRAY['Быстрое создание — всего 5 минут на одного ребенка'::text, 'Выездные мастер-классы в любые учреждения'::text, 'Уникальные 3D-сувениры ручной работы'::text, 'Безопасные материалы для детей'::text],
    process_title character varying(255) DEFAULT 'Как проходит мастер-класс'::character varying,
    process_steps jsonb[] DEFAULT ARRAY['{"title": "Подготовка", "description": "Ребенок выбирает цвет воска и готовится к творческому процессу"}'::jsonb, '{"title": "Создание", "description": "Под руководством мастера ребенок создает 3D-копию своей руки"}'::jsonb, '{"title": "Готово!", "description": "Уникальный сувенир готов и может быть забран домой"}'::jsonb],
    safety_title character varying(255) DEFAULT 'Безопасность и качество'::character varying,
    safety_description text DEFAULT 'Мы используем только высококачественные, безопасные для детей материалы. Все наши мастера имеют опыт работы с детьми и проходят специальное обучение по технике безопасности.'::text
);


--
-- Name: about_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.about_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: about_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.about_id_seq OWNED BY public.about.id;


--
-- Name: about_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.about_media (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    type character varying(10) NOT NULL,
    title character varying(255),
    description text,
    order_index integer DEFAULT 0,
    file_path character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT about_media_type_check CHECK (((type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[])))
);


--
-- Name: about_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.about_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: about_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.about_media_id_seq OWNED BY public.about_media.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    chat_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_type character varying(10) NOT NULL,
    message text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    file_url text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_messages_sender_type_check CHECK (((sender_type)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT check_sender_valid CHECK (public.check_sender_exists(sender_id, sender_type))
);


--
-- Name: chat_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    chat_id uuid NOT NULL,
    unread_count integer DEFAULT 0,
    last_read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    admin_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_message_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    master_class_id uuid NOT NULL,
    workshop_date date NOT NULL,
    city character varying(100) NOT NULL,
    school_name character varying(255) NOT NULL,
    class_group character varying(100) NOT NULL,
    participant_name character varying(255) NOT NULL,
    participant_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    selected_styles jsonb DEFAULT '[]'::jsonb,
    selected_options jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_id character varying(255),
    payment_method character varying(50),
    payment_date timestamp without time zone,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: COLUMN invoices.payment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.invoices.payment_id IS 'ID платежа в платежной системе';


--
-- Name: COLUMN invoices.payment_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.invoices.payment_method IS 'Метод оплаты (yandex, card, etc.)';


--
-- Name: COLUMN invoices.payment_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.invoices.payment_date IS 'Дата и время оплаты';


--
-- Name: master_class_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_class_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    school_id uuid NOT NULL,
    class_group character varying(100) NOT NULL,
    service_id uuid NOT NULL,
    executors jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    participants jsonb DEFAULT '[]'::jsonb NOT NULL,
    statistics jsonb DEFAULT '{"paidAmount": 0, "stylesStats": {}, "totalAmount": 0, "optionsStats": {}, "unpaidAmount": 0, "totalParticipants": 0}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    city character varying(100) DEFAULT 'Не указан'::character varying
);


--
-- Name: master_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    max_participants integer NOT NULL,
    materials jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id uuid,
    master_class_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    total_price numeric(10,2) NOT NULL,
    scheduled_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    classes jsonb DEFAULT '[]'::jsonb NOT NULL,
    teacher character varying(255),
    teacher_phone character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    short_description text,
    full_description text,
    styles jsonb DEFAULT '[]'::jsonb,
    options jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    surname character varying(255),
    role character varying(20) NOT NULL,
    email character varying(255),
    phone character varying(50),
    password_hash character varying(255),
    school_id uuid,
    school_name character varying(255),
    class character varying(50),
    shift character varying(10),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    class_group character varying(50),
    parent_id uuid,
    age integer,
    CONSTRAINT users_age_check CHECK (((age >= 0) AND (age <= 120))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'parent'::character varying, 'child'::character varying, 'executor'::character varying])::text[])))
);


--
-- Name: workshop_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshop_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workshop_id uuid NOT NULL,
    user_id uuid NOT NULL,
    style character varying(100) NOT NULL,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workshop_registrations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: workshop_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshop_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid NOT NULL,
    school_name character varying(255) NOT NULL,
    class_group character varying(100) NOT NULL,
    desired_date date NOT NULL,
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    admin_notes text,
    admin_id uuid,
    CONSTRAINT workshop_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: about id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.about ALTER COLUMN id SET DEFAULT nextval('public.about_id_seq'::regclass);


--
-- Name: about_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.about_media ALTER COLUMN id SET DEFAULT nextval('public.about_media_id_seq'::regclass);


--
-- Name: about_media about_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.about_media
    ADD CONSTRAINT about_media_pkey PRIMARY KEY (id);


--
-- Name: about about_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.about
    ADD CONSTRAINT about_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_notifications chat_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_notifications
    ADD CONSTRAINT chat_notifications_pkey PRIMARY KEY (id);


--
-- Name: chat_notifications chat_notifications_user_id_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_notifications
    ADD CONSTRAINT chat_notifications_user_id_chat_id_key UNIQUE (user_id, chat_id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: master_class_events master_class_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_class_events
    ADD CONSTRAINT master_class_events_pkey PRIMARY KEY (id);


--
-- Name: master_classes master_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_classes
    ADD CONSTRAINT master_classes_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workshop_registrations workshop_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_registrations
    ADD CONSTRAINT workshop_registrations_pkey PRIMARY KEY (id);


--
-- Name: workshop_registrations workshop_registrations_workshop_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_registrations
    ADD CONSTRAINT workshop_registrations_workshop_id_user_id_key UNIQUE (workshop_id, user_id);


--
-- Name: workshop_requests workshop_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_requests
    ADD CONSTRAINT workshop_requests_pkey PRIMARY KEY (id);


--
-- Name: idx_chat_messages_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages USING btree (chat_id);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages USING btree (sender_id);


--
-- Name: idx_chat_notifications_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_notifications_chat_id ON public.chat_notifications USING btree (chat_id);


--
-- Name: idx_chat_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_notifications_user_id ON public.chat_notifications USING btree (user_id);


--
-- Name: idx_chats_last_message_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chats_last_message_at ON public.chats USING btree (last_message_at);


--
-- Name: idx_chats_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chats_status ON public.chats USING btree (status);


--
-- Name: idx_chats_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chats_user_id ON public.chats USING btree (user_id);


--
-- Name: idx_invoices_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_city ON public.invoices USING btree (city);


--
-- Name: idx_invoices_class_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_class_group ON public.invoices USING btree (class_group);


--
-- Name: idx_invoices_master_class_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_master_class_id ON public.invoices USING btree (master_class_id);


--
-- Name: idx_invoices_participant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_participant_id ON public.invoices USING btree (participant_id);


--
-- Name: idx_invoices_school_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_school_name ON public.invoices USING btree (school_name);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_workshop_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_workshop_date ON public.invoices USING btree (workshop_date);


--
-- Name: idx_master_class_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_master_class_events_date ON public.master_class_events USING btree (date);


--
-- Name: idx_master_class_events_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_master_class_events_school ON public.master_class_events USING btree (school_id);


--
-- Name: idx_master_classes_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_master_classes_is_active ON public.master_classes USING btree (is_active);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_services_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);


--
-- Name: idx_users_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_parent_id ON public.users USING btree (parent_id);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_school_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_school_id ON public.users USING btree (school_id);


--
-- Name: idx_workshop_registrations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workshop_registrations_status ON public.workshop_registrations USING btree (status);


--
-- Name: idx_workshop_registrations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workshop_registrations_user_id ON public.workshop_registrations USING btree (user_id);


--
-- Name: idx_workshop_registrations_workshop_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workshop_registrations_workshop_id ON public.workshop_registrations USING btree (workshop_id);


--
-- Name: idx_workshop_requests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workshop_requests_created_at ON public.workshop_requests USING btree (created_at);


--
-- Name: idx_workshop_requests_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workshop_requests_parent_id ON public.workshop_requests USING btree (parent_id);


--
-- Name: idx_workshop_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workshop_requests_status ON public.workshop_requests USING btree (status);


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: master_class_events update_master_class_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_master_class_events_updated_at BEFORE UPDATE ON public.master_class_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: master_classes update_master_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_master_classes_updated_at BEFORE UPDATE ON public.master_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: schools update_schools_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workshop_registrations update_workshop_registrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workshop_registrations_updated_at BEFORE UPDATE ON public.workshop_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_messages chat_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: chat_notifications chat_notifications_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_notifications
    ADD CONSTRAINT chat_notifications_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: chat_notifications chat_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_notifications
    ADD CONSTRAINT chat_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chats chats_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chats chats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_master_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_master_class_id_fkey FOREIGN KEY (master_class_id) REFERENCES public.master_class_events(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: master_class_events master_class_events_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_class_events
    ADD CONSTRAINT master_class_events_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE RESTRICT;


--
-- Name: master_class_events master_class_events_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_class_events
    ADD CONSTRAINT master_class_events_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;


--
-- Name: orders orders_master_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_master_class_id_fkey FOREIGN KEY (master_class_id) REFERENCES public.master_classes(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- Name: workshop_registrations workshop_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_registrations
    ADD CONSTRAINT workshop_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workshop_registrations workshop_registrations_workshop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_registrations
    ADD CONSTRAINT workshop_registrations_workshop_id_fkey FOREIGN KEY (workshop_id) REFERENCES public.master_class_events(id) ON DELETE CASCADE;


--
-- Name: workshop_requests workshop_requests_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_requests
    ADD CONSTRAINT workshop_requests_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workshop_requests workshop_requests_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_requests
    ADD CONSTRAINT workshop_requests_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


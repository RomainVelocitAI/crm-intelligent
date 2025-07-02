--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: contact_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contact_status AS ENUM (
    'CLIENT_ACTIF',
    'PROSPECT_CHAUD',
    'PROSPECT_TIEDE',
    'PROSPECT_FROID',
    'INACTIF'
);


ALTER TYPE public.contact_status OWNER TO postgres;

--
-- Name: interaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.interaction_type AS ENUM (
    'EMAIL',
    'TELEPHONE',
    'REUNION',
    'DEVIS',
    'COMMANDE',
    'AUTRE'
);


ALTER TYPE public.interaction_type OWNER TO postgres;

--
-- Name: quote_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.quote_status AS ENUM (
    'BROUILLON',
    'ENVOYE',
    'VU',
    'ACCEPTE',
    'REFUSE',
    'EXPIRE',
    'TERMINE',
    'ARCHIVE'
);


ALTER TYPE public.quote_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    "userId" text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    telephone text,
    entreprise text,
    poste text,
    siret text,
    adresse text,
    "codePostal" text,
    ville text,
    pays text DEFAULT 'France'::text NOT NULL,
    statut public.contact_status DEFAULT 'PROSPECT_FROID'::public.contact_status NOT NULL,
    "scoreValeur" double precision DEFAULT 0 NOT NULL,
    "chiffresAffairesTotal" double precision DEFAULT 0 NOT NULL,
    "tauxConversion" double precision DEFAULT 0 NOT NULL,
    "panierMoyen" double precision DEFAULT 0 NOT NULL,
    "derniereInteraction" timestamp(3) without time zone,
    "dernierAchat" timestamp(3) without time zone,
    notes text,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: email_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_tracking (
    id text NOT NULL,
    "quoteId" text NOT NULL,
    email text NOT NULL,
    ouvert boolean DEFAULT false NOT NULL,
    "dateOuverture" timestamp(3) without time zone,
    "nombreOuvertures" integer DEFAULT 0 NOT NULL,
    clique boolean DEFAULT false NOT NULL,
    "dateClique" timestamp(3) without time zone,
    "nombreCliques" integer DEFAULT 0 NOT NULL,
    "derniereActivite" timestamp(3) without time zone,
    "userAgent" text,
    "adresseIP" text,
    "scoreConfiance" integer DEFAULT 0 NOT NULL,
    "estBot" boolean DEFAULT false NOT NULL,
    "estPrechargement" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.email_tracking OWNER TO postgres;

--
-- Name: generic_emails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.generic_emails (
    id text NOT NULL,
    "contactId" text NOT NULL,
    "userId" text NOT NULL,
    "trackingId" text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "openedAt" timestamp(3) without time zone,
    "isOpened" boolean DEFAULT false NOT NULL,
    "openCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.generic_emails OWNER TO postgres;

--
-- Name: interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interactions (
    id text NOT NULL,
    "contactId" text NOT NULL,
    type public.interaction_type NOT NULL,
    objet text,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.interactions OWNER TO postgres;

--
-- Name: quote_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_items (
    id text NOT NULL,
    "quoteId" text NOT NULL,
    "serviceId" text,
    designation text NOT NULL,
    description text,
    quantite double precision NOT NULL,
    "prixUnitaire" double precision NOT NULL,
    "tauxTva" double precision DEFAULT 20 NOT NULL,
    total double precision NOT NULL,
    ordre integer NOT NULL,
    conserver boolean DEFAULT false NOT NULL
);


ALTER TABLE public.quote_items OWNER TO postgres;

--
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id text NOT NULL,
    "userId" text NOT NULL,
    "contactId" text,
    numero text NOT NULL,
    objet text NOT NULL,
    statut public.quote_status DEFAULT 'BROUILLON'::public.quote_status NOT NULL,
    "dateCreation" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateValidite" timestamp(3) without time zone NOT NULL,
    "dateEnvoi" timestamp(3) without time zone,
    "dateAcceptation" timestamp(3) without time zone,
    "dateConsultation" timestamp(3) without time zone,
    "sousTotal" double precision DEFAULT 0 NOT NULL,
    tva double precision DEFAULT 0 NOT NULL,
    total double precision DEFAULT 0 NOT NULL,
    conditions text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id text NOT NULL,
    "userId" text NOT NULL,
    nom text NOT NULL,
    description text,
    "prixUnitaire" double precision NOT NULL,
    unite text NOT NULL,
    categorie text,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    entreprise text,
    siret text,
    "numeroTvaIntracommunautaire" text,
    telephone text,
    adresse text,
    "codePostal" text,
    ville text,
    pays text DEFAULT 'France'::text NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    "skipArchiveWarning" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: email_tracking email_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_pkey PRIMARY KEY (id);


--
-- Name: generic_emails generic_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_emails
    ADD CONSTRAINT generic_emails_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: email_tracking_quoteId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "email_tracking_quoteId_email_key" ON public.email_tracking USING btree ("quoteId", email);


--
-- Name: generic_emails_trackingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "generic_emails_trackingId_key" ON public.generic_emails USING btree ("trackingId");


--
-- Name: quotes_numero_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX quotes_numero_key ON public.quotes USING btree (numero);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: contacts contacts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_tracking email_tracking_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT "email_tracking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public.quotes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: generic_emails generic_emails_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_emails
    ADD CONSTRAINT "generic_emails_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: generic_emails generic_emails_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generic_emails
    ADD CONSTRAINT "generic_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interactions interactions_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quote_items quote_items_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public.quotes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quote_items quote_items_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT "quote_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotes quotes_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT "quotes_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotes quotes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


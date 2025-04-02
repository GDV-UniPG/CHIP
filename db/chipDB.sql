--
-- PostgreSQL database dump
--

-- Dumped from database version 13.0
-- Dumped by pg_dump version 13.0

-- Started on 2025-04-02 18:47:26

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

SET default_table_access_method = heap;

--
-- TOC entry 200 (class 1259 OID 84806)
-- Name: country; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country (
    name character varying(255) NOT NULL,
    region character varying
);


--
-- TOC entry 201 (class 1259 OID 84812)
-- Name: external_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_link (
    id_url integer NOT NULL,
    id_poi integer,
    url text
);


--
-- TOC entry 202 (class 1259 OID 84818)
-- Name: external_link_id_url_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_link_id_url_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3134 (class 0 OID 0)
-- Dependencies: 202
-- Name: external_link_id_url_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_link_id_url_seq OWNED BY public.external_link.id_url;


--
-- TOC entry 203 (class 1259 OID 84820)
-- Name: geo_point; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_point (
    id integer NOT NULL,
    latitude double precision,
    longitude double precision
);


--
-- TOC entry 204 (class 1259 OID 84823)
-- Name: geo_point_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.geo_point_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3135 (class 0 OID 0)
-- Dependencies: 204
-- Name: geo_point_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.geo_point_id_seq OWNED BY public.geo_point.id;


--
-- TOC entry 224 (class 1259 OID 93240)
-- Name: municipality_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.municipality_id_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    MAXVALUE 2147483647
    CACHE 1;


--
-- TOC entry 223 (class 1259 OID 93232)
-- Name: municipality; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.municipality (
    id integer DEFAULT nextval('public.municipality_id_seq'::regclass) NOT NULL,
    name character varying NOT NULL,
    id_geo integer,
    district character varying
);


--
-- TOC entry 205 (class 1259 OID 84825)
-- Name: poi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poi (
    id integer NOT NULL,
    name character varying(255),
    description text,
    url_primary character varying(255),
    wiki_url character varying(255),
    id_openstreetmap character varying(255),
    id_geo_point integer,
    has_been_changed boolean DEFAULT false,
    nome text,
    descrizione text,
    sentiment_value double precision,
    has_score_changed boolean DEFAULT false,
    image_url text,
    description_en text,
    id_municipality integer
);


--
-- TOC entry 206 (class 1259 OID 84832)
-- Name: poi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.poi_id_seq
    AS integer
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    MAXVALUE 214748364
    CACHE 1;


--
-- TOC entry 3136 (class 0 OID 0)
-- Dependencies: 206
-- Name: poi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.poi_id_seq OWNED BY public.poi.id;


--
-- TOC entry 207 (class 1259 OID 84834)
-- Name: poi_toi_score; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poi_toi_score (
    id_poi integer NOT NULL,
    id_toi integer NOT NULL,
    score double precision,
    normalized_score double precision,
    norm_score double precision
);


--
-- TOC entry 208 (class 1259 OID 84837)
-- Name: poi_vectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.poi_vectors (
    id integer NOT NULL,
    vector_column real[]
);


--
-- TOC entry 209 (class 1259 OID 84843)
-- Name: poi_vectors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.poi_vectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3137 (class 0 OID 0)
-- Dependencies: 209
-- Name: poi_vectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.poi_vectors_id_seq OWNED BY public.poi_vectors.id;


--
-- TOC entry 225 (class 1259 OID 93294)
-- Name: sentiment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sentiment (
    id_poi integer NOT NULL,
    positive double precision,
    negative double precision,
    neutral double precision
);


--
-- TOC entry 210 (class 1259 OID 84845)
-- Name: step_of_tour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.step_of_tour (
    id_tour integer NOT NULL,
    order_step integer NOT NULL,
    id_geo integer,
    t_visit_min integer,
    t_end integer,
    day integer NOT NULL
);


--
-- TOC entry 211 (class 1259 OID 84848)
-- Name: toi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.toi (
    id integer NOT NULL,
    name character varying(255),
    description text,
    has_been_changed boolean DEFAULT false NOT NULL,
    nome character varying,
    descrizione text,
    color text
);


--
-- TOC entry 212 (class 1259 OID 84855)
-- Name: toi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.toi_id_seq
    AS integer
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3138 (class 0 OID 0)
-- Dependencies: 212
-- Name: toi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.toi_id_seq OWNED BY public.toi.id;


--
-- TOC entry 213 (class 1259 OID 84865)
-- Name: tour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tour (
    id integer NOT NULL,
    name character varying(255),
    description text,
    id_user integer,
    id_mean integer,
    score integer,
    total_duration integer,
    favorite boolean DEFAULT false NOT NULL
);


--
-- TOC entry 214 (class 1259 OID 84871)
-- Name: tour_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tour_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3139 (class 0 OID 0)
-- Dependencies: 214
-- Name: tour_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tour_id_seq OWNED BY public.tour.id;


--
-- TOC entry 215 (class 1259 OID 84873)
-- Name: transport_mean; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transport_mean (
    id integer NOT NULL,
    name character varying(255)
);


--
-- TOC entry 216 (class 1259 OID 84876)
-- Name: transport_mean_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transport_mean_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3140 (class 0 OID 0)
-- Dependencies: 216
-- Name: transport_mean_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transport_mean_id_seq OWNED BY public.transport_mean.id;


--
-- TOC entry 217 (class 1259 OID 84881)
-- Name: user_toi_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_toi_preference (
    id_toi integer NOT NULL,
    id_user integer NOT NULL,
    score_preference double precision
);


--
-- TOC entry 218 (class 1259 OID 84884)
-- Name: user_toi_similarity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_toi_similarity (
    id_toi integer NOT NULL,
    id_user integer NOT NULL,
    score_similarity integer
);


--
-- TOC entry 219 (class 1259 OID 84887)
-- Name: userprofile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.userprofile (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    password character varying(255),
    date_of_birth date,
    gender character varying(10),
    country character varying(255),
    is_verified boolean NOT NULL,
    role character varying(255),
    surname character varying(255)
);


--
-- TOC entry 220 (class 1259 OID 84893)
-- Name: userprofile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.userprofile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3141 (class 0 OID 0)
-- Dependencies: 220
-- Name: userprofile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.userprofile_id_seq OWNED BY public.userprofile.id;


--
-- TOC entry 221 (class 1259 OID 84895)
-- Name: visit_duration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_duration (
    id_poi integer NOT NULL,
    id_visit integer NOT NULL,
    duration_min integer
);


--
-- TOC entry 222 (class 1259 OID 84898)
-- Name: visit_duration_id_visit_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_duration_id_visit_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3142 (class 0 OID 0)
-- Dependencies: 222
-- Name: visit_duration_id_visit_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_duration_id_visit_seq OWNED BY public.visit_duration.id_visit;


--
-- TOC entry 2936 (class 2604 OID 84900)
-- Name: external_link id_url; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_link ALTER COLUMN id_url SET DEFAULT nextval('public.external_link_id_url_seq'::regclass);


--
-- TOC entry 2937 (class 2604 OID 84901)
-- Name: geo_point id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_point ALTER COLUMN id SET DEFAULT nextval('public.geo_point_id_seq'::regclass);


--
-- TOC entry 2939 (class 2604 OID 84902)
-- Name: poi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi ALTER COLUMN id SET DEFAULT nextval('public.poi_id_seq'::regclass);


--
-- TOC entry 2941 (class 2604 OID 84903)
-- Name: poi_vectors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi_vectors ALTER COLUMN id SET DEFAULT nextval('public.poi_vectors_id_seq'::regclass);


--
-- TOC entry 2943 (class 2604 OID 84904)
-- Name: toi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.toi ALTER COLUMN id SET DEFAULT nextval('public.toi_id_seq'::regclass);


--
-- TOC entry 2944 (class 2604 OID 84906)
-- Name: tour id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour ALTER COLUMN id SET DEFAULT nextval('public.tour_id_seq'::regclass);


--
-- TOC entry 2946 (class 2604 OID 84907)
-- Name: transport_mean id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transport_mean ALTER COLUMN id SET DEFAULT nextval('public.transport_mean_id_seq'::regclass);


--
-- TOC entry 2947 (class 2604 OID 84908)
-- Name: userprofile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userprofile ALTER COLUMN id SET DEFAULT nextval('public.userprofile_id_seq'::regclass);


--
-- TOC entry 2948 (class 2604 OID 84909)
-- Name: visit_duration id_visit; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_duration ALTER COLUMN id_visit SET DEFAULT nextval('public.visit_duration_id_visit_seq'::regclass);


--
-- TOC entry 2979 (class 2606 OID 93239)
-- Name: municipality comune_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipality
    ADD CONSTRAINT comune_pkey PRIMARY KEY (id);


--
-- TOC entry 2951 (class 2606 OID 84916)
-- Name: country country_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (name);


--
-- TOC entry 2953 (class 2606 OID 84918)
-- Name: external_link external_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_link
    ADD CONSTRAINT external_link_pkey PRIMARY KEY (id_url);


--
-- TOC entry 2955 (class 2606 OID 84920)
-- Name: geo_point geo_point_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_point
    ADD CONSTRAINT geo_point_pkey PRIMARY KEY (id);


--
-- TOC entry 2957 (class 2606 OID 84922)
-- Name: poi poi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi
    ADD CONSTRAINT poi_pkey PRIMARY KEY (id);


--
-- TOC entry 2959 (class 2606 OID 84924)
-- Name: poi_toi_score poi_toi_score_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi_toi_score
    ADD CONSTRAINT poi_toi_score_pkey PRIMARY KEY (id_poi, id_toi);


--
-- TOC entry 2961 (class 2606 OID 84926)
-- Name: poi_vectors poi_vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi_vectors
    ADD CONSTRAINT poi_vectors_pkey PRIMARY KEY (id);


--
-- TOC entry 2981 (class 2606 OID 93298)
-- Name: sentiment sentiment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment
    ADD CONSTRAINT sentiment_pkey PRIMARY KEY (id_poi);


--
-- TOC entry 2963 (class 2606 OID 93251)
-- Name: step_of_tour step_of_tour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_of_tour
    ADD CONSTRAINT step_of_tour_pkey PRIMARY KEY (id_tour, order_step, day);


--
-- TOC entry 2965 (class 2606 OID 84930)
-- Name: toi toi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.toi
    ADD CONSTRAINT toi_pkey PRIMARY KEY (id);


--
-- TOC entry 2967 (class 2606 OID 84934)
-- Name: tour tour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT tour_pkey PRIMARY KEY (id);


--
-- TOC entry 2969 (class 2606 OID 84936)
-- Name: transport_mean transport_mean_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transport_mean
    ADD CONSTRAINT transport_mean_pkey PRIMARY KEY (id);


--
-- TOC entry 2971 (class 2606 OID 84940)
-- Name: user_toi_preference user_toi_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toi_preference
    ADD CONSTRAINT user_toi_preference_pkey PRIMARY KEY (id_toi, id_user);


--
-- TOC entry 2973 (class 2606 OID 84942)
-- Name: user_toi_similarity user_toi_similarity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toi_similarity
    ADD CONSTRAINT user_toi_similarity_pkey PRIMARY KEY (id_toi, id_user);


--
-- TOC entry 2975 (class 2606 OID 84944)
-- Name: userprofile userprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userprofile
    ADD CONSTRAINT userprofile_pkey PRIMARY KEY (id);


--
-- TOC entry 2977 (class 2606 OID 84946)
-- Name: visit_duration visit_duration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_duration
    ADD CONSTRAINT visit_duration_pkey PRIMARY KEY (id_poi, id_visit);


--
-- TOC entry 2982 (class 2606 OID 84947)
-- Name: external_link external_link_id_poi_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_link
    ADD CONSTRAINT external_link_id_poi_foreignkey FOREIGN KEY (id_poi) REFERENCES public.poi(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2997 (class 2606 OID 93263)
-- Name: municipality geo_id_geo_point_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipality
    ADD CONSTRAINT geo_id_geo_point_foreignkey FOREIGN KEY (id_geo) REFERENCES public.geo_point(id) NOT VALID;


--
-- TOC entry 2990 (class 2606 OID 93243)
-- Name: tour mean_id_tour_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT mean_id_tour_foreignkey FOREIGN KEY (id_mean) REFERENCES public.transport_mean(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2983 (class 2606 OID 84952)
-- Name: poi poi_id_geo_point_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi
    ADD CONSTRAINT poi_id_geo_point_foreignkey FOREIGN KEY (id_geo_point) REFERENCES public.geo_point(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2984 (class 2606 OID 103468)
-- Name: poi poi_id_municipality_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi
    ADD CONSTRAINT poi_id_municipality_foreignkey FOREIGN KEY (id_municipality) REFERENCES public.municipality(id) NOT VALID;


--
-- TOC entry 2985 (class 2606 OID 84957)
-- Name: poi_toi_score poi_toi_score_id_poi_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi_toi_score
    ADD CONSTRAINT poi_toi_score_id_poi_foreignkey FOREIGN KEY (id_poi) REFERENCES public.poi(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2986 (class 2606 OID 84962)
-- Name: poi_toi_score poi_toi_score_id_toi_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.poi_toi_score
    ADD CONSTRAINT poi_toi_score_id_toi_foreignkey FOREIGN KEY (id_toi) REFERENCES public.toi(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2998 (class 2606 OID 93514)
-- Name: sentiment sentiment_id_poi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sentiment
    ADD CONSTRAINT sentiment_id_poi_fkey FOREIGN KEY (id_poi) REFERENCES public.poi(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2987 (class 2606 OID 84967)
-- Name: step_of_tour step_of_tour_id_geo_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_of_tour
    ADD CONSTRAINT step_of_tour_id_geo_foreignkey FOREIGN KEY (id_geo) REFERENCES public.geo_point(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2988 (class 2606 OID 84977)
-- Name: step_of_tour step_of_tour_id_tour_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_of_tour
    ADD CONSTRAINT step_of_tour_id_tour_foreignkey FOREIGN KEY (id_tour) REFERENCES public.tour(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2989 (class 2606 OID 84982)
-- Name: tour tour_id_user_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour
    ADD CONSTRAINT tour_id_user_foreignkey FOREIGN KEY (id_user) REFERENCES public.userprofile(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2991 (class 2606 OID 84997)
-- Name: user_toi_preference user_toi_preference_id_toi_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toi_preference
    ADD CONSTRAINT user_toi_preference_id_toi_foreignkey FOREIGN KEY (id_toi) REFERENCES public.toi(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2992 (class 2606 OID 85002)
-- Name: user_toi_preference user_toi_preference_id_user_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toi_preference
    ADD CONSTRAINT user_toi_preference_id_user_foreignkey FOREIGN KEY (id_user) REFERENCES public.userprofile(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2993 (class 2606 OID 85007)
-- Name: user_toi_similarity user_toi_similarity_id_toi_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toi_similarity
    ADD CONSTRAINT user_toi_similarity_id_toi_foreignkey FOREIGN KEY (id_toi) REFERENCES public.toi(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2994 (class 2606 OID 85012)
-- Name: user_toi_similarity user_toi_similarity_id_user_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_toi_similarity
    ADD CONSTRAINT user_toi_similarity_id_user_foreignkey FOREIGN KEY (id_user) REFERENCES public.userprofile(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2995 (class 2606 OID 85017)
-- Name: userprofile userprofile_name_origin_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.userprofile
    ADD CONSTRAINT userprofile_name_origin_foreignkey FOREIGN KEY (country) REFERENCES public.country(name) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 2996 (class 2606 OID 85022)
-- Name: visit_duration visit_duration_id_poi_foreignkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_duration
    ADD CONSTRAINT visit_duration_id_poi_foreignkey FOREIGN KEY (id_poi) REFERENCES public.poi(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


-- Completed on 2025-04-02 18:47:27

--
-- PostgreSQL database dump complete
--


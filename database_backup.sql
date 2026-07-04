--
-- PostgreSQL database dump
--

\restrict i8573m6cSxU15Kmakx0QCnBS2UFcSjKghxkvx460Jo9ObmKfAXdHSiXFiT1ZbZK

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    story text,
    filename text NOT NULL,
    original_filename text NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    cover text,
    screenshots jsonb DEFAULT '[]'::jsonb NOT NULL,
    system_min jsonb,
    system_rec jsonb,
    download_count integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.games (id, name, description, story, filename, original_filename, file_size, cover, screenshots, system_min, system_rec, download_count, view_count, created_at) FROM stdin;
b4a6a1c9-4f29-420a-8628-ece5719bfacd	Townscaper		لا يتوفر وصف للعبة :( !	gcs:games/files/b4a6a1c9-4f29-420a-8628-ece5719bfacd.rar	Townscaper[GameBlaze.com].rar	75920572	ad883298-c389-4df7-a176-bef8480ce502.jpg	[]	{"cpu": "لعبة خفيفة تعمل على مواصفات عادية :)"}	\N	3	2	2026-05-02 18:55:13.908
f5c69f3a-5de1-4a4e-9cbb-89247dc4b49d	Poly Bridge		اللعبة عبارة عن لعبة ألغاز محاكاة لبناء الجسور	gcs:games/files/f5c69f3a-5de1-4a4e-9cbb-89247dc4b49d.rar	PolyBridge[GameBlaze.com].rar	128627832	5a8b33d2-ed9b-4bd5-a1a9-4f1069a50eaa.jpg	[]	{"cpu": "لعبة خفيفة تعمل على مواصفات عادية :)"}	\N	7	8	2026-05-02 20:00:13.821
72f6aa01-7ee1-4f28-9c5a-ba421936cba8	Generals Zero Hour Reborn V4.0 Rise To Power		اقدم اليكم مود رائع من لعبة Command & Conquer Generals Zero Hour المود باسم Command & Conquer Generals Zero Hour Reborn V4.0 Rise To Power\r\nهذا التحديث من اللعبة لقد اتى مع العديد من الاضافات من خرائط\r\nوجيوش جديدة وتعديل على الجيوش السابقة ومن الجيوش الجديدة\r\nقوات صدام حسين و جيش اسامة بن لادن وايضا الاجيش الامريكي بالاسلحة المتطورة و 3 جيوش جديدة لدولة الصين\r\nتحديث رهيب من اللعبة لا يفوتكم	gcs:games/files/72f6aa01-7ee1-4f28-9c5a-ba421936cba8.rar	Generals.Zero.Hour.Reborn[GameBlaze.com].rar	574887071	b66932fd-c1e7-4125-b2ba-f7137c2a446f.jpg	[]	{"cpu": "لعبة خفيفة تعمل على اقل المواصفات تقريبا 256 ميغامن ذاكرة الرام وكرت الشاشة 128 ميغا"}	\N	10	9	2026-05-03 07:44:51.33
6d19c437-0a6c-43b5-b21b-b3d11eba1d39	لعبة البقرة الخارقة Supercow		لا يتوفر وصف للعبة :( !	gcs:games/files/6d19c437-0a6c-43b5-b21b-b3d11eba1d39.rar	Supercow[GameBlaze.com].rar	31584512	4e4d5753-6ce3-4663-bad3-355113ffc629.png	[]	{"cpu": "لعبة خفيفة تعمل على مواصفات عادية :)"}	\N	7	1	2026-05-01 14:56:25.013
e5f4862c-839b-444d-8af6-4627d5ecdd98	Counter Strike Source		هي لعبة حماية المنشآت التي وضعتها شركة فالف. وهي نسخة جديدة كاملة من كاونتر سترايك وتشابه بشكل كبير الجزء الأولى ولكن في هذا النسخة تم إضافة بعض الخرائط وبعض الاضافات\r\nلعبة كونتر سترايك متميزة جدا و لكن في اصدار سورس اصبح التميز\r\nخارق القوة و تم زيادة الصور والجرافيك والمؤثرات وكل شئ بس حقا يميزها هو اعتمادها علي Source E محرك سورس الجديد والرهيب و تم استعماله كأصدار احدث واعلي للعبة و مميزاته\r\n\r\nسلسلة كانتر سترايك تعتمد وبشكل كبير على العاب الشبكة ولا زلت تحتفظ بالأسلوب القديم مع بعض التحسينات	gcs:games/files/e5f4862c-839b-444d-8af6-4627d5ecdd98.rar	Counter-Strike.Source[GameBlaze.com].rar	2051021862	a7ac4bb1-df04-4107-8a9e-c7652039850f.webp	[]	{"gpu": "كرت شاشة 512MB", "ram": "رامات 2GB"}	\N	13	13	2026-05-03 07:19:13.476
5d1ba953-1537-440c-ae96-3508fbcf3c21	The Hulk		بالتاكيد لقد شاهدنا الفيلم الشهير The Hulk او المعروف الرجل الاخضر\r\nهذه اللعبة تحكي وباختصار قصة الفيلم وصراع Hulk معى جنرال بالجيش الامريكي حيث يحاول هذا الجنرال اسر هالك وحويله الى سلاح يستفيد منه الجيش	gcs:games/files/5d1ba953-1537-440c-ae96-3508fbcf3c21.rar	Hulk[GameBlaze.com].rar	744287221	gcs:games/covers/5d1ba953-1537-440c-ae96-3508fbcf3c21.webp	[]	{"cpu": "لعبة خفيفة تعمل على اقل المواصفات"}	\N	2	4	2026-06-03 09:08:38.39
867db8ac-74d1-4dbb-a4cb-43a3f00829f6	تحميل لعبة القتال القديمة مورتال كومبات تريلجي Mortal Kombat Trilogy		لعبة القتال القديمة مورتال كومبات تريلجي "Mortal Kombat Trilogy" الغنية عن التعريف	867db8ac-74d1-4dbb-a4cb-43a3f00829f6.rar	Mortal.Kombat.Trilogy[wifi4games.com].rar	46276275	58346832-80ec-441f-b9ee-7cb7e8b0242b.png	[]	{"cpu": "لعبة خفيفة تعمل على مواصفات عادية :)"}	\N	1	4	2026-05-01 14:36:50.061
c8b28c5c-5d00-490c-ab0b-311e0709e251	I Know a Guy: Shady Life Simulator		لا يتوفر وصف للعبة :( !	gcs:games/files/c8b28c5c-5d00-490c-ab0b-311e0709e251.rar	I.Know.a.Guy.Shady.Life.Simulator[GameBlaze.com].rar	1526751875	gcs:games/covers/c8b28c5c-5d00-490c-ab0b-311e0709e251.jpg	[]	{"cpu": "المعالج: AMD Ryzen 5 1600 or Intel Core i5-8400", "gpu": "كرت الفيديو: Nvidia GTX 1060 or AMD Radeon RX580", "ram": "الرام: 8 GB"}	{"cpu": "المعالج: AMD Ryzen 5 3600 or Intel Core i5-10400", "gpu": "كرت الفيديو: Nvidia RTX 2060 or AMD Radeon RX 6600"}	3	2	2026-06-18 10:32:55.472
\.


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict i8573m6cSxU15Kmakx0QCnBS2UFcSjKghxkvx460Jo9ObmKfAXdHSiXFiT1ZbZK


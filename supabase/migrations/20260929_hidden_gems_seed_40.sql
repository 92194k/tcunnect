-- TCUnnect Hidden Gems — 40 Destination Seed Data
-- Run each block separately in Supabase SQL Editor
-- Generated: 2026-09-29
-- Schema: hidden_gems + gem_content_items

-- ============================================================
-- [1/40] Nacpan Beach (Beach)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Nacpan Beach',
    'El Nido, Palawan',
    'Beach',
    '₱₱',
    'A long stretch of golden sand with clear blue water and a peaceful island atmosphere.',
    'Visit early in the morning for fewer crowds.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Twin Beach Viewpoint', 'Scenic viewpoint overlooking Nacpan and Calitang beaches', '0.5 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Calitang Beach', 'Quiet beach beside Nacpan', '1 km', 'Beach', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Beach Swimming', 'Enjoy the clear coastal waters', NULL, 'Swimming', '2–3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Sunset Viewing', 'Watch the sunset along the shore', NULL, 'Sunset', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Beachside Seafood Grill', 'Fresh seafood and Filipino dishes', NULL, NULL, NULL, NULL, '₱300–₱700/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Shell Crafts', 'Handmade coastal souvenirs', NULL, NULL, NULL, NULL, NULL, 'Nacpan Local Stalls', NULL),
    (gem_id, 'stays', 0, 'Nacpan Beach Resort', 'Beachfront accommodation', NULL, NULL, NULL, 'Resort', 'From ₱2,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Nacpan Sunset Picnic', 'Private beach picnic experience', NULL, NULL, NULL, NULL, '₱800/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [2/40] White Beach (Beach)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'White Beach',
    'Boracay, Aklan',
    'Beach',
    '₱₱₱',
    'Boracay''s famous white-sand beach known for its clear waters, sunsets, and lively atmosphere.',
    'Visit during sunset for the best beach views.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'White Beach Station 1', 'Wide beachfront area', '1 km', 'Beach', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'D''Mall', 'Shopping and dining area', '1.5 km', 'Shopping', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Island Hopping', 'Explore nearby islands', NULL, 'Island Hopping', '5–6 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Sunset Paraw Ride', 'Traditional sailing experience', NULL, 'Sailing', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Beachfront Filipino Restaurant', 'Local seafood and Filipino meals', NULL, NULL, NULL, NULL, '₱300–₱800/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Boracay Souvenirs', 'Local shirts and handmade items', NULL, NULL, NULL, NULL, NULL, 'D''Mall Shops', NULL),
    (gem_id, 'stays', 0, 'Beachfront Hotel', 'Comfortable accommodation near the beach', NULL, NULL, NULL, 'Hotel', 'From ₱3,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Sunset Paraw Sailing', 'Traditional sailing at sunset', NULL, NULL, NULL, NULL, '₱1,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [3/40] Siargao Island (Beach)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Siargao Island',
    'General Luna, Surigao del Norte',
    'Beach',
    '₱₱',
    'A tropical island destination known for surfing, lagoons, and relaxed island life.',
    'Rent a motorbike to explore beyond General Luna.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Cloud 9', 'Famous surfing spot', '3 km', 'Surf Spot', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Sugba Lagoon', 'Turquoise lagoon surrounded by limestone', '25 km', 'Lagoon', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Surfing Lesson', 'Beginner-friendly surfing session', NULL, 'Surfing', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Island Hopping', 'Visit nearby island beaches', NULL, 'Island Hopping', '5 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Island Grill House', 'Fresh seafood and local meals', NULL, NULL, NULL, NULL, '₱250–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Coconut Products', 'Handmade island products', NULL, NULL, NULL, NULL, NULL, 'General Luna Shops', NULL),
    (gem_id, 'stays', 0, 'Island Guesthouse', 'Budget-friendly island accommodation', NULL, NULL, NULL, 'Guesthouse', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Beginner Surf Lesson', 'Guided surfing session', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [4/40] Calaguas Island (Beach)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Calaguas Island',
    'Vinzons, Camarines Norte',
    'Beach',
    '₱₱',
    'A peaceful island getaway featuring white sand, clear water, and a less commercial atmosphere.',
    'Bring cash and basic supplies before heading to the island.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Mahabang Buhangin Beach', 'Main white-sand beach', '0 km', 'Beach', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Tinaga Island Viewpoint', 'Scenic island viewpoint', '1 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Beach Camping', 'Overnight beachfront camping', NULL, 'Camping', '1 night', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Island Swimming', 'Swim in clear coastal waters', NULL, 'Swimming', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Island Seafood Stall', 'Fresh seafood meals', NULL, NULL, NULL, NULL, '₱250–₱500/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Handmade Island Bracelets', 'Simple local souvenirs', NULL, NULL, NULL, NULL, NULL, 'Beachside Stalls', NULL),
    (gem_id, 'stays', 0, 'Beach Tent Camp', 'Basic beachfront camping', NULL, NULL, NULL, 'Camping', 'From ₱800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Island Camping Experience', 'Guided overnight island stay', NULL, NULL, NULL, NULL, '₱1,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [5/40] Panglao Beach (Beach)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Panglao Beach',
    'Panglao, Bohol',
    'Beach',
    '₱₱',
    'A popular Bohol beach destination with clear water, resorts, restaurants, and diving activities.',
    'Book activities early during peak season.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Alona Beach', 'Main tourist beach', '0 km', 'Beach', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Doljo Beach', 'Quieter coastal area', '7 km', 'Beach', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Snorkeling', 'Explore nearby coral areas', NULL, 'Snorkeling', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Dolphin Watching', 'Early morning boat activity', NULL, 'Wildlife', '4 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Panglao Seafood Grill', 'Seafood and Filipino cuisine', NULL, NULL, NULL, NULL, '₱300–₱700/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Bohol Peanut Products', 'Popular local snacks', NULL, NULL, NULL, NULL, NULL, 'Panglao Shops', NULL),
    (gem_id, 'stays', 0, 'Panglao Beach Resort', 'Resort near the coast', NULL, NULL, NULL, 'Resort', 'From ₱2,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Bohol Island Hopping', 'Guided island tour', NULL, NULL, NULL, NULL, '₱1,800/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [6/40] Mt. Daraitan (Mountain)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Mt. Daraitan',
    'Tanay, Rizal',
    'Mountain',
    '₱₱',
    'A popular hiking destination offering mountain views, limestone formations, and river scenery.',
    'Start before sunrise to avoid the midday heat.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Summit Viewdeck', 'Panoramic mountain view', '5 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Tinipak River', 'Clear river surrounded by rocks', '3 km', 'River', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Guided Summit Trek', 'Mountain trekking with local guide', NULL, 'Hiking', '6–8 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'River Trek', 'Explore Tinipak River', NULL, 'Trekking', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Mountain View Eatery', 'Filipino comfort food', NULL, NULL, NULL, NULL, '₱150–₱350/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Coffee', 'Locally produced coffee', NULL, NULL, NULL, NULL, NULL, 'Farmers'' Stalls', NULL),
    (gem_id, 'stays', 0, 'Daraitan Homestay', 'Simple local accommodation', NULL, NULL, NULL, 'Homestay', 'From ₱800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Guided Daraitan Trek', 'Local guided hiking experience', NULL, NULL, NULL, NULL, '₱1,200/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [7/40] Mt. Pulag (Mountain)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Mt. Pulag',
    'Benguet',
    'Mountain',
    '₱₱',
    'A famous mountain destination known for sea-of-clouds views and sunrise hikes.',
    'Bring warm clothing because temperatures can become very low.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Mt. Pulag Summit', 'Famous sea-of-clouds viewpoint', '8 km', 'Summit', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Ambangeg Trail', 'Popular hiking route', NULL, 'Trail', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Sunrise Trek', 'Early morning summit hike', NULL, 'Hiking', '8–10 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Camping', 'Overnight mountain camping', NULL, 'Camping', '1 night', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Mountain Eatery', 'Warm Filipino meals', NULL, NULL, NULL, NULL, '₱150–₱350/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Benguet Coffee', 'Locally grown coffee', NULL, NULL, NULL, NULL, NULL, 'Local Farmers', NULL),
    (gem_id, 'stays', 0, 'Mountain Homestay', 'Basic accommodation', NULL, NULL, NULL, 'Homestay', 'From ₱1,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Sea of Clouds Trek', 'Guided mountain experience', NULL, NULL, NULL, NULL, '₱1,800/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [8/40] Mt. Ulap (Mountain)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Mt. Ulap',
    'Itogon, Benguet',
    'Mountain',
    '₱₱',
    'A scenic mountain trail featuring grasslands, pine trees, and panoramic Cordillera views.',
    'Start early for cooler weather.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Ambanaw Paoay', 'Mountain viewpoint', '3 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Gungal Rock', 'Famous rock formation', '4 km', 'Rock Formation', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Day Hike', 'Complete the mountain trail', NULL, 'Hiking', '5–7 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Landscape Photography', 'Capture Cordillera scenery', NULL, 'Photography', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Mountain Carinderia', 'Local Filipino meals', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Benguet Vegetables', 'Fresh local produce', NULL, NULL, NULL, NULL, NULL, 'Roadside Farmers', NULL),
    (gem_id, 'stays', 0, 'Pine Cabin', 'Mountain accommodation', NULL, NULL, NULL, 'Cabin', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Guided Mt. Ulap Trek', 'Guided mountain hike', NULL, NULL, NULL, NULL, '₱1,200/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [9/40] Mt. Pinatubo (Mountain)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Mt. Pinatubo',
    'Botolan, Zambales',
    'Mountain',
    '₱₱',
    'A volcanic destination featuring a dramatic crater lake surrounded by rugged landscapes.',
    'Leave early because the trail can become hot later in the day.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Pinatubo Crater Lake', 'Main destination', '7 km', 'Crater', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Crow Valley', 'Volcanic landscape', '5 km', 'Landscape', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, '4x4 Adventure', 'Ride through volcanic terrain', NULL, 'Adventure', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Crater Trek', 'Hike toward the crater', NULL, 'Hiking', '3–4 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Filipino Eatery', 'Home-style meals', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Volcanic Stone Souvenirs', 'Local souvenir products', NULL, NULL, NULL, NULL, NULL, 'Trail Stalls', NULL),
    (gem_id, 'stays', 0, 'Zambales Guesthouse', 'Local accommodation', NULL, NULL, NULL, 'Guesthouse', 'From ₱1,200/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Pinatubo 4x4 Tour', 'Guided volcanic adventure', NULL, NULL, NULL, NULL, '₱2,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [10/40] Osmeña Peak (Mountain)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Osmeña Peak',
    'Dalaguete, Cebu',
    'Mountain',
    '₱₱',
    'Cebu''s highest peak, known for its distinctive jagged hills and sunrise scenery.',
    'Visit before sunrise for cooler weather.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Osmeña Peak', 'Main summit', '1.5 km', 'Summit', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Mantalongon Hills', 'Rolling mountain landscape', '3 km', 'Hills', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Sunrise Hike', 'Short summit trek', NULL, 'Hiking', '2–3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Camping', 'Overnight mountain stay', NULL, 'Camping', '1 night', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Mountain Breakfast Stall', 'Local breakfast meals', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Cebu Dried Mangoes', 'Local food products', NULL, NULL, NULL, NULL, NULL, 'Local Stores', NULL),
    (gem_id, 'stays', 0, 'Mountain Homestay', 'Basic local accommodation', NULL, NULL, NULL, 'Homestay', 'From ₱800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Sunrise Trek', 'Guided Osmeña Peak hike', NULL, NULL, NULL, NULL, '₱900/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [11/40] Masungi Georeserve (Nature)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Masungi Georeserve',
    'Baras, Rizal',
    'Nature',
    '₱₱₱',
    'A conservation area featuring limestone formations, forest trails, rope courses, and scenic viewpoints.',
    'Reserve your trail schedule ahead of time.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Sapot', 'Elevated rope structure', '2 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Ditse, Patak, Duyan', 'Limestone formations', '3 km', 'Formation', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Discovery Trail', 'Guided nature exploration', NULL, 'Nature Trail', '3–4 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Photography', 'Capture forest landscapes', NULL, 'Photography', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Georeserve Dining Area', 'Curated local meals', NULL, NULL, NULL, NULL, '₱400–₱800/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Conservation Merchandise', 'Branded eco-products', NULL, NULL, NULL, NULL, NULL, 'Georeserve Store', NULL),
    (gem_id, 'stays', 0, 'Eco Lodge', 'Nature-focused accommodation', NULL, NULL, NULL, 'Eco Lodge', 'From ₱3,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Guided Discovery Trail', 'Conservation-focused experience', NULL, NULL, NULL, NULL, '₱1,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [12/40] Puerto Princesa Underground River (Nature)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Puerto Princesa Underground River',
    'Puerto Princesa, Palawan',
    'Nature',
    '₱₱',
    'A protected natural attraction featuring an underground river surrounded by limestone landscapes.',
    'Book a tour package that includes permits and transportation.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Underground River', 'Main attraction', NULL, 'Cave', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Sabang Beach', 'Coastal area near the park', '2 km', 'Beach', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Underground River Tour', 'Guided boat exploration', NULL, 'Boat Tour', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Jungle Walk', 'Explore surrounding forest', NULL, 'Nature Walk', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Sabang Seafood Restaurant', 'Local seafood meals', NULL, NULL, NULL, NULL, '₱300–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Palawan Handicrafts', 'Local handmade products', NULL, NULL, NULL, NULL, NULL, 'Sabang Shops', NULL),
    (gem_id, 'stays', 0, 'Sabang Eco Lodge', 'Nature accommodation', NULL, NULL, NULL, 'Eco Lodge', 'From ₱1,800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Underground River Tour', 'Guided river exploration', NULL, NULL, NULL, NULL, '₱2,000/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [13/40] Ninoy Aquino Parks and Wildlife Center (Nature)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Ninoy Aquino Parks and Wildlife Center',
    'Quezon City, Metro Manila',
    'Nature',
    '₱',
    'An urban nature park featuring greenery, wildlife areas, and recreational spaces.',
    'Visit early when the weather is cooler.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Wildlife Rescue Center', 'Wildlife conservation area', '0.5 km', 'Wildlife', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Lagoon', 'Scenic park area', '0.3 km', 'Nature', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Nature Walk', 'Explore the park', NULL, 'Nature Walk', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Wildlife Viewing', 'Observe rescued animals', NULL, 'Wildlife', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Park Snack Stall', 'Light snacks and drinks', NULL, NULL, NULL, NULL, '₱100–₱250/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Nature-Themed Souvenirs', 'Small local crafts', NULL, NULL, NULL, NULL, NULL, 'Park Shops', NULL),
    (gem_id, 'experiences', 0, 'Wildlife Discovery Walk', 'Guided park exploration', NULL, NULL, NULL, NULL, '₱300/person', NULL, 'View Details');
END $$;

-- ============================================================
-- [14/40] Las Casas Filipinas de Acuzar (Nature)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Las Casas Filipinas de Acuzar',
    'Bagac, Bataan',
    'Nature',
    '₱₱₱',
    'A heritage destination combining restored architecture, gardens, riverside views, and cultural experiences.',
    'Stay overnight to experience the property after sunset.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Heritage Village', 'Restored historic structures', NULL, 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'River Walk', 'Scenic riverside area', '0.5 km', 'Nature', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Heritage Walk', 'Guided cultural tour', NULL, 'Walking Tour', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'River Cruise', 'Scenic boat ride', NULL, 'Boat Ride', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Filipino Heritage Restaurant', 'Traditional Filipino cuisine', NULL, NULL, NULL, NULL, '₱400–₱900/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Filipino Handicrafts', 'Traditional crafts', NULL, NULL, NULL, NULL, NULL, 'Heritage Shops', NULL),
    (gem_id, 'stays', 0, 'Heritage Casa', 'Historic-style accommodation', NULL, NULL, NULL, 'Heritage Stay', 'From ₱4,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Heritage Tour', 'Guided cultural experience', NULL, NULL, NULL, NULL, '₱1,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [15/40] Bakhaw Forest (Nature)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Bakhaw Forest',
    'Kalibo, Aklan',
    'Nature',
    '₱',
    'A mangrove forest offering a peaceful nature experience close to the town center.',
    'Visit during the morning for a cooler walk.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Mangrove Boardwalk', 'Forest walking route', NULL, 'Boardwalk', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Mangrove Area', 'Natural coastal ecosystem', '0.5 km', 'Mangrove', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Mangrove Walk', 'Explore the forest', NULL, 'Nature Walk', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Bird Watching', 'Observe local bird species', NULL, 'Wildlife', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Aklanon Eatery', 'Regional Filipino food', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Mangrove-Themed Crafts', 'Local handmade items', NULL, NULL, NULL, NULL, NULL, 'Community Stalls', NULL),
    (gem_id, 'stays', 0, 'Local Homestay', 'Affordable accommodation', NULL, NULL, NULL, 'Homestay', 'From ₱800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Mangrove Eco Tour', 'Guided environmental tour', NULL, NULL, NULL, NULL, '₱500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [16/40] Calle Crisologo (Heritage)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Calle Crisologo',
    'Vigan City, Ilocos Sur',
    'Heritage',
    '₱₱',
    'A historic cobblestone street lined with Spanish-era houses, shops, and restaurants.',
    'Visit in the evening when the street lights create a different atmosphere.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Calle Crisologo', 'Historic street', NULL, 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Vigan Cathedral', 'Historic church', '0.5 km', 'Church', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Heritage Walking Tour', 'Explore historic streets', NULL, 'Heritage Tour', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Kalesa Ride', 'Traditional horse carriage ride', NULL, 'Kalesa', '30–45 min', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Vigan Empanada Stall', 'Local Ilocano specialty', NULL, NULL, NULL, NULL, '₱100–₱250/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Abel Iloko Textiles', 'Traditional woven products', NULL, NULL, NULL, NULL, NULL, 'Calle Crisologo Shops', NULL),
    (gem_id, 'stays', 0, 'Heritage Inn', 'Historic-style accommodation', NULL, NULL, NULL, 'Heritage Inn', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Vigan Heritage Tour', 'Guided cultural tour', NULL, NULL, NULL, NULL, '₱800/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [17/40] Intramuros (Heritage)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Intramuros',
    'Manila',
    'Heritage',
    '₱',
    'Manila''s historic walled city featuring Spanish-era buildings, churches, and museums.',
    'Start your walking tour early to avoid the heat.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Fort Santiago', 'Historic fortress', '1 km', 'Fortress', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'San Agustin Church', 'Historic church', '0.5 km', 'Church', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Heritage Walk', 'Explore historic streets', NULL, 'Walking', '2–3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Bambike Tour', 'Guided bicycle tour', NULL, 'Cycling', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Intramuros Filipino Restaurant', 'Traditional Filipino meals', NULL, NULL, NULL, NULL, '₱250–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Filipino History Books', 'Local cultural products', NULL, NULL, NULL, NULL, NULL, 'Heritage Shops', NULL),
    (gem_id, 'stays', 0, 'Intramuros Hotel', 'Nearby historic accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱2,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Intramuros Bambike Tour', 'Guided heritage cycling', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [18/40] Las Casas Filipinas de Acuzar (Heritage)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Las Casas Filipinas de Acuzar',
    'Bagac, Bataan',
    'Heritage',
    '₱₱₱',
    'A heritage resort featuring reconstructed historic Filipino architecture and cultural activities.',
    'Join a guided tour to learn the history behind the structures.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Heritage Village', 'Historic architecture', NULL, 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Plaza de Castila', 'Spanish-inspired plaza', '0.5 km', 'Plaza', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Cultural Tour', 'Explore historic structures', NULL, 'Heritage Tour', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Kalesa Ride', 'Traditional carriage ride', NULL, 'Kalesa', '30 min', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Heritage Filipino Restaurant', 'Traditional cuisine', NULL, NULL, NULL, NULL, '₱400–₱900/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Filipino Crafts', 'Handmade cultural products', NULL, NULL, NULL, NULL, NULL, 'Heritage Shops', NULL),
    (gem_id, 'stays', 0, 'Heritage Casa', 'Historic accommodation', NULL, NULL, NULL, 'Heritage Stay', 'From ₱4,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Heritage Walking Tour', 'Guided cultural experience', NULL, NULL, NULL, NULL, '₱1,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [19/40] Mabini Shrine (Heritage)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Mabini Shrine',
    'Tanauan, Batangas',
    'Heritage',
    '₱',
    'A historical site dedicated to Filipino revolutionary leader Apolinario Mabini.',
    'Combine the visit with nearby historical attractions.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Mabini Shrine', 'Historical landmark', NULL, 'Shrine', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Museum Area', 'Historical exhibits', '0.2 km', 'Museum', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Museum Visit', 'Learn about Mabini''s life', NULL, 'History', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Heritage Walk', 'Explore the surrounding area', NULL, 'Walking', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Batangas Eatery', 'Regional Filipino cuisine', NULL, NULL, NULL, NULL, '₱150–₱350/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Batangas Coffee', 'Local coffee products', NULL, NULL, NULL, NULL, NULL, 'Local Shops', NULL),
    (gem_id, 'stays', 0, 'Local Guesthouse', 'Simple accommodation', NULL, NULL, NULL, 'Guesthouse', 'From ₱1,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Historical Learning Tour', 'Guided history experience', NULL, NULL, NULL, NULL, '₱400/person', NULL, 'View Details');
END $$;

-- ============================================================
-- [20/40] Heritage of Cebu Monument (Heritage)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Heritage of Cebu Monument',
    'Cebu City, Cebu',
    'Heritage',
    '₱',
    'A landmark depicting important scenes and figures from Cebu''s history and culture.',
    'Visit nearby heritage attractions on the same walking route.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Heritage Monument', 'Main landmark', NULL, 'Monument', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Yap-Sandiego Ancestral House', 'Historic house', '0.3 km', 'Ancestral House', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Heritage Walk', 'Explore Cebu''s historic district', NULL, 'Walking', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Museum Visit', 'Discover local history', NULL, 'Museum', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Cebu Local Eatery', 'Cebuano dishes', NULL, NULL, NULL, NULL, '₱200–₱400/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Cebuano Handicrafts', 'Local cultural products', NULL, NULL, NULL, NULL, NULL, 'Heritage Shops', NULL),
    (gem_id, 'stays', 0, 'Cebu City Hotel', 'Central accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Cebu Heritage Walking Tour', 'Guided historical tour', NULL, NULL, NULL, NULL, '₱700/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [21/40] Café by the Ruins (Cafe)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Café by the Ruins',
    'Baguio City',
    'Cafe',
    '₱₱',
    'A cozy Baguio café known for its garden atmosphere and local-inspired dishes.',
    'Visit during weekday mornings for a quieter experience.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Garden Dining Area', 'Relaxing café garden', NULL, 'Garden', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Ruins Area', 'Historic café surroundings', '0.1 km', 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Coffee Tasting', 'Try local coffee', NULL, 'Coffee', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Café Hopping', 'Explore nearby cafés', NULL, 'Café Hopping', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Café by the Ruins', 'Filipino-inspired dishes and coffee', NULL, NULL, NULL, NULL, '₱250–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Baguio Coffee Beans', 'Local coffee products', NULL, NULL, NULL, NULL, NULL, 'Café Shop', NULL),
    (gem_id, 'stays', 0, 'Baguio Boutique Inn', 'Cozy accommodation', NULL, NULL, NULL, 'Boutique Inn', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Local Coffee Tasting', 'Guided coffee experience', NULL, NULL, NULL, NULL, '₱500/person', NULL, 'Inquire');
END $$;

-- ============================================================
-- [22/40] Bag of Beans (Cafe)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Bag of Beans',
    'Tagaytay, Cavite',
    'Cafe',
    '₱₱',
    'A well-known Tagaytay dining and café destination with garden spaces and comfort food.',
    'Visit during cooler afternoons.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Garden Area', 'Relaxing outdoor dining space', NULL, 'Garden', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Tagaytay View Area', 'Scenic surroundings', '1 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Café Dining', 'Enjoy local meals and drinks', NULL, 'Dining', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Dessert Tasting', 'Try house desserts', NULL, 'Desserts', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Bag of Beans Restaurant', 'Filipino and international dishes', NULL, NULL, NULL, NULL, '₱300–₱700/meal', NULL, NULL),
    (gem_id, 'products', 0, 'House Coffee Beans', 'Café-roasted products', NULL, NULL, NULL, NULL, NULL, 'Café Store', NULL),
    (gem_id, 'stays', 0, 'Bag of Beans Hotel', 'Café-style accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱3,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Tagaytay Café Escape', 'Café and food experience', NULL, NULL, NULL, NULL, '₱800/person', NULL, 'Inquire');
END $$;

-- ============================================================
-- [23/40] Coffee Project (Cafe)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Coffee Project',
    'Silang, Cavite',
    'Cafe',
    '₱₱',
    'A visually designed café offering coffee, desserts, and a relaxing dining atmosphere.',
    'Try visiting on weekday afternoons.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Garden Dining Area', 'Outdoor café area', NULL, 'Garden', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Café Interior', 'Designed dining space', NULL, 'Café', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Coffee Tasting', 'Sample specialty drinks', NULL, 'Coffee', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Café Photography', 'Explore photo-friendly spaces', NULL, 'Photography', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Coffee Project', 'Coffee, pastries, and meals', NULL, NULL, NULL, NULL, '₱250–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Specialty Coffee', 'Packaged coffee products', NULL, NULL, NULL, NULL, NULL, 'Café Store', NULL),
    (gem_id, 'stays', 0, 'Nearby Boutique Hotel', 'Comfortable local stay', NULL, NULL, NULL, 'Hotel', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Coffee & Dessert Set', 'Café tasting experience', NULL, NULL, NULL, NULL, '₱600/person', NULL, 'Inquire');
END $$;

-- ============================================================
-- [24/40] Tahanan Bistro Café (Cafe)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Tahanan Bistro Café',
    'Antipolo, Rizal',
    'Cafe',
    '₱₱',
    'A cozy café and dining destination offering Filipino-inspired food and a relaxed atmosphere.',
    'Visit before dinner for a quieter experience.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Garden Area', 'Outdoor dining space', NULL, 'Garden', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Scenic View Area', 'Antipolo landscape', '1 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Café Dining', 'Enjoy coffee and meals', NULL, 'Dining', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Sunset Viewing', 'Enjoy the surrounding scenery', NULL, 'Sunset', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Tahanan Bistro', 'Filipino-inspired dishes', NULL, NULL, NULL, NULL, '₱300–₱700/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Coffee Beans', 'Regional coffee products', NULL, NULL, NULL, NULL, NULL, 'Café Store', NULL),
    (gem_id, 'stays', 0, 'Antipolo Boutique Inn', 'Local accommodation', NULL, NULL, NULL, 'Inn', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Filipino Café Experience', 'Food and coffee tasting', NULL, NULL, NULL, NULL, '₱700/person', NULL, 'Inquire');
END $$;

-- ============================================================
-- [25/40] The Ruins Café (Cafe)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'The Ruins Café',
    'Talisay, Negros Occidental',
    'Cafe',
    '₱₱',
    'A café experience near the famous Ruins, combining food, coffee, gardens, and heritage scenery.',
    'Visit before sunset to explore the grounds.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'The Ruins', 'Historic mansion', '0.2 km', 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Garden Grounds', 'Scenic garden area', '0.1 km', 'Garden', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Coffee Break', 'Enjoy coffee in a scenic setting', NULL, 'Coffee', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Heritage Photography', 'Capture the historic surroundings', NULL, 'Photography', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Ruins Café', 'Local meals and desserts', NULL, NULL, NULL, NULL, '₱250–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Negros Coffee', 'Local coffee products', NULL, NULL, NULL, NULL, NULL, 'Café Store', NULL),
    (gem_id, 'stays', 0, 'Talisay Guesthouse', 'Nearby accommodation', NULL, NULL, NULL, 'Guesthouse', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Café & Heritage Tour', 'Combined café and heritage experience', NULL, NULL, NULL, NULL, '₱800/person', NULL, 'Inquire');
END $$;

-- ============================================================
-- [26/40] Hulugan Falls (Waterfalls)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Hulugan Falls',
    'Luisiana, Laguna',
    'Waterfalls',
    '₱',
    'A scenic waterfall surrounded by lush vegetation and natural pools.',
    'Wear proper footwear because the trail can be slippery.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Main Falls', 'Main waterfall', NULL, 'Waterfall', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Natural Pool', 'Swimming area', '0.1 km', 'Pool', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Waterfall Trek', 'Hike toward the falls', NULL, 'Hiking', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Swimming', 'Enjoy the natural pool', NULL, 'Swimming', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Eatery', 'Filipino comfort food', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Snacks', 'Homemade food products', NULL, NULL, NULL, NULL, NULL, 'Community Stalls', NULL),
    (gem_id, 'stays', 0, 'Luisiana Homestay', 'Local accommodation', NULL, NULL, NULL, 'Homestay', 'From ₱800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Guided Waterfall Trek', 'Local guided hike', NULL, NULL, NULL, NULL, '₱500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [27/40] Pagsanjan Falls (Waterfalls)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Pagsanjan Falls',
    'Laguna',
    'Waterfalls',
    '₱₱',
    'A famous waterfall destination reached through a scenic river journey surrounded by lush landscapes.',
    'Wear waterproof clothing during the boat ride.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Pagsanjan Falls', 'Main waterfall', NULL, 'Waterfall', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Pagsanjan River', 'Scenic river route', '2 km', 'River', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Boat Adventure', 'River boat ride', NULL, 'Boat Ride', '2–3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Waterfall Visit', 'Explore the falls', NULL, 'Waterfall', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Riverside Restaurant', 'Filipino meals', NULL, NULL, NULL, NULL, '₱250–₱500/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Laguna Souvenirs', 'Local crafts', NULL, NULL, NULL, NULL, NULL, 'Riverside Shops', NULL),
    (gem_id, 'stays', 0, 'Pagsanjan Hotel', 'Local accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Pagsanjan Falls Boat Tour', 'Guided river adventure', NULL, NULL, NULL, NULL, '₱1,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [28/40] Kawasan Falls (Waterfalls)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Kawasan Falls',
    'Badian, Cebu',
    'Waterfalls',
    '₱₱',
    'A multi-tiered waterfall known for turquoise water and outdoor adventure activities.',
    'Wear secure footwear for the canyoning route.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Main Falls', 'Famous turquoise waterfall', NULL, 'Waterfall', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Canyon Area', 'Adventure route', '2 km', 'Canyon', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Canyoneering', 'Guided canyon adventure', NULL, 'Adventure', '4–5 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Swimming', 'Swim in the natural pools', NULL, 'Swimming', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Kawasan Local Eatery', 'Filipino meals', NULL, NULL, NULL, NULL, '₱200–₱400/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Cebuano Souvenirs', 'Local crafts', NULL, NULL, NULL, NULL, NULL, 'Community Stalls', NULL),
    (gem_id, 'stays', 0, 'Badian Resort', 'Local resort accommodation', NULL, NULL, NULL, 'Resort', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Kawasan Canyoneering', 'Guided canyoning adventure', NULL, NULL, NULL, NULL, '₱2,500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [29/40] Tinago Falls (Waterfalls)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Tinago Falls',
    'Iligan City, Lanao del Norte',
    'Waterfalls',
    '₱₱',
    'A beautiful waterfall hidden within a lush gorge and surrounded by tropical scenery.',
    'Bring waterproof bags for your belongings.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Main Falls', 'Main waterfall and pool', NULL, 'Waterfall', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Viewing Area', 'Scenic waterfall viewpoint', '0.2 km', 'Viewpoint', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Swimming', 'Enjoy the natural pool', NULL, 'Swimming', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Waterfall Photography', 'Capture the scenery', NULL, 'Photography', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Falls Eatery', 'Simple Filipino food', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Iligan Local Snacks', 'Regional food products', NULL, NULL, NULL, NULL, NULL, 'Local Vendors', NULL),
    (gem_id, 'stays', 0, 'Iligan City Hotel', 'Nearby accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Tinago Falls Tour', 'Guided waterfall visit', NULL, NULL, NULL, NULL, '₱800/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [30/40] Cambais Falls (Waterfalls)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Cambais Falls',
    'Alegria, Cebu',
    'Waterfalls',
    '₱',
    'A peaceful waterfall destination with natural pools and a forest setting.',
    'Hire a local guide if visiting for the first time.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Main Falls', 'Main waterfall', NULL, 'Waterfall', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Natural Pools', 'Swimming areas', '0.2 km', 'Pool', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Waterfall Trek', 'Explore the forest trail', NULL, 'Hiking', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Swimming', 'Relax in the natural pools', NULL, 'Swimming', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Local Cebuano Eatery', 'Regional dishes', NULL, NULL, NULL, NULL, '₱150–₱300/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Coconut Products', 'Handmade products', NULL, NULL, NULL, NULL, NULL, 'Community Stalls', NULL),
    (gem_id, 'stays', 0, 'Alegria Homestay', 'Simple local stay', NULL, NULL, NULL, 'Homestay', 'From ₱700/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Cambais Falls Trek', 'Guided waterfall trek', NULL, NULL, NULL, NULL, '₱500/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [31/40] Bonifacio Global City (City)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Bonifacio Global City',
    'Taguig City, Metro Manila',
    'City',
    '₱₱',
    'A modern urban district known for restaurants, shopping, art, parks, and nightlife.',
    'Explore on foot during late afternoon.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Bonifacio High Street', 'Shopping and dining area', NULL, 'Shopping', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'The Mind Museum', 'Science museum', '1 km', 'Museum', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'City Walk', 'Explore BGC streets', NULL, 'City Walk', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Food Crawl', 'Try restaurants and cafés', NULL, 'Food Trip', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'BGC Food District', 'Wide range of restaurants', NULL, NULL, NULL, NULL, '₱300–₱800/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Local Designer Goods', 'Filipino fashion and crafts', NULL, NULL, NULL, NULL, NULL, 'BGC Shops', NULL),
    (gem_id, 'stays', 0, 'BGC Hotel', 'Modern city accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱3,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'BGC Food & Art Walk', 'Guided urban experience', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Get Directions');
END $$;

-- ============================================================
-- [32/40] Makati CBD (City)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Makati CBD',
    'Makati City, Metro Manila',
    'City',
    '₱₱',
    'A major business and lifestyle district featuring shopping centers, restaurants, parks, and art spaces.',
    'Explore the area after office hours for a livelier atmosphere.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Ayala Triangle', 'Urban park', '0.5 km', 'Park', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Greenbelt', 'Shopping and dining complex', '1 km', 'Shopping', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Museum Hopping', 'Explore local art spaces', NULL, 'Museum', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Food Crawl', 'Try restaurants and cafés', NULL, 'Food Trip', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Makati Restaurant District', 'Filipino and international cuisine', NULL, NULL, NULL, NULL, '₱300–₱800/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Filipino Artisan Goods', 'Local fashion and crafts', NULL, NULL, NULL, NULL, NULL, 'Makati Shops', NULL),
    (gem_id, 'stays', 0, 'Makati City Hotel', 'Business district accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱2,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Makati Food & Art Walk', 'Guided city experience', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Get Directions');
END $$;

-- ============================================================
-- [33/40] Cebu IT Park (City)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Cebu IT Park',
    'Cebu City, Cebu',
    'City',
    '₱₱',
    'A modern urban district filled with restaurants, cafés, shops, offices, and entertainment areas.',
    'Visit at night to experience the food and entertainment scene.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Sugbo Mercado', 'Popular food market', '0.5 km', 'Food Market', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Ayala Center Cebu', 'Shopping center', '2 km', 'Shopping', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Food Trip', 'Explore local food stalls', NULL, 'Food Crawl', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Night Walk', 'Explore the district at night', NULL, 'Nightlife', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Sugbo Mercado', 'Local and international street food', NULL, NULL, NULL, NULL, '₱150–₱500/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Cebu Souvenirs', 'Local snacks and crafts', NULL, NULL, NULL, NULL, NULL, 'Nearby Shops', NULL),
    (gem_id, 'stays', 0, 'Cebu IT Park Hotel', 'Modern accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Cebu Food Crawl', 'Guided food experience', NULL, NULL, NULL, NULL, '₱900/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [34/40] Iloilo Business Park (City)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Iloilo Business Park',
    'Iloilo City',
    'City',
    '₱₱',
    'A modern district combining dining, shopping, business, and entertainment spaces.',
    'Explore during the evening when the area becomes more lively.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Festive Walk', 'Shopping and dining area', NULL, 'Shopping', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Iloilo Convention Center', 'Modern landmark', '0.5 km', 'Landmark', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Food Crawl', 'Try Iloilo restaurants', NULL, 'Food Trip', '2–3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'City Photography', 'Explore modern architecture', NULL, 'Photography', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Festive Walk Restaurants', 'Local and international dishes', NULL, NULL, NULL, NULL, '₱250–₱700/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Iloilo Food Products', 'Local delicacies', NULL, NULL, NULL, NULL, NULL, 'Festive Walk Shops', NULL),
    (gem_id, 'stays', 0, 'Business Park Hotel', 'Modern accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Iloilo Food & City Tour', 'Guided urban tour', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [35/40] Davao City Center (City)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Davao City Center',
    'Davao City',
    'City',
    '₱₱',
    'A lively urban area offering shopping, food, culture, parks, and access to nearby attractions.',
    'Visit local markets for authentic Davao products.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'People''s Park', 'Urban park', '1 km', 'Park', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Roxas Night Market', 'Evening food market', '2 km', 'Food Market', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Night Market Food Crawl', 'Explore local food stalls', NULL, 'Food Trip', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'City Sightseeing', 'Visit central attractions', NULL, 'City Tour', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Davao Food Market', 'Local dishes and street food', NULL, NULL, NULL, NULL, '₱150–₱500/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Davao Durian Products', 'Local delicacies', NULL, NULL, NULL, NULL, NULL, 'City Markets', NULL),
    (gem_id, 'stays', 0, 'Davao City Hotel', 'Central accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Davao Food & City Tour', 'Guided city experience', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [36/40] Pampanga Food District (Food)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Pampanga Food District',
    'Angeles City, Pampanga',
    'Food',
    '₱₱',
    'A food destination known for Kapampangan cuisine and iconic Filipino dishes.',
    'Visit with a group so you can try more dishes.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Local Food Streets', 'Restaurants and food stalls', NULL, 'Food District', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Angeles Heritage Area', 'Historic surroundings', '2 km', 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Food Crawl', 'Sample Kapampangan specialties', NULL, 'Food Crawl', '3–4 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Cooking Class', 'Learn local recipes', NULL, 'Cooking', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Kapampangan Restaurant', 'Sisig and local specialties', NULL, NULL, NULL, NULL, '₱250–₱600/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Pampanga Sauces', 'Local sauces and condiments', NULL, NULL, NULL, NULL, NULL, 'Local Markets', NULL),
    (gem_id, 'stays', 0, 'Angeles City Hotel', 'Comfortable city accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Kapampangan Food Tour', 'Guided local food experience', NULL, NULL, NULL, NULL, '₱1,200/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [37/40] Mercato Centrale (Food)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Mercato Centrale',
    'Taguig City, Metro Manila',
    'Food',
    '₱',
    'A popular food market featuring Filipino street food, desserts, and specialty dishes.',
    'Bring cash and arrive early for popular food stalls.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Food Stalls', 'Wide selection of dishes', NULL, 'Food Market', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Dessert Area', 'Local sweets and drinks', '0.1 km', 'Desserts', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Food Crawl', 'Try multiple food stalls', NULL, 'Food Crawl', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Dessert Hunting', 'Explore dessert vendors', NULL, 'Desserts', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Mercato Food Stalls', 'Filipino and international street food', NULL, NULL, NULL, NULL, '₱100–₱500/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Homemade Sauces', 'Local food products', NULL, NULL, NULL, NULL, NULL, 'Market Vendors', NULL),
    (gem_id, 'stays', 0, 'Nearby City Hotel', 'Accommodation near the market', NULL, NULL, NULL, 'Hotel', 'From ₱2,000/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Mercato Food Crawl', 'Guided market food experience', NULL, NULL, NULL, NULL, '₱700/person', NULL, 'View Details');
END $$;

-- ============================================================
-- [38/40] Dampa Seafood Market (Food)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Dampa Seafood Market',
    'Pasay City, Metro Manila',
    'Food',
    '₱₱',
    'A seafood destination where visitors can choose fresh seafood and have it cooked by nearby restaurants.',
    'Compare prices before buying seafood.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Seafood Market', 'Fresh seafood stalls', NULL, 'Market', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Cooking Restaurants', 'Nearby seafood restaurants', '0.1 km', 'Restaurant', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Seafood Shopping', 'Select fresh seafood', NULL, 'Market', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Seafood Dining', 'Have seafood cooked fresh', NULL, 'Dining', '1–2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Fresh Seafood Restaurants', 'Cooked-to-order seafood', NULL, NULL, NULL, NULL, '₱400–₱1,000/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Dried Seafood', 'Local seafood products', NULL, NULL, NULL, NULL, NULL, 'Market Stalls', NULL),
    (gem_id, 'stays', 0, 'Pasay City Hotel', 'Nearby accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,800/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Dampa Seafood Experience', 'Seafood shopping and dining', NULL, NULL, NULL, NULL, '₱1,200/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [39/40] Binondo Food Crawl (Food)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Binondo Food Crawl',
    'Manila',
    'Food',
    '₱',
    'A food adventure through one of Manila''s oldest districts, featuring Chinese-Filipino dishes and street food.',
    'Visit with friends so you can share dishes.',
    '{}',
    NULL,
    'approved',
    true,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'Ongpin Street', 'Famous food street', NULL, 'Food Street', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Binondo Church', 'Historic landmark', '0.5 km', 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Food Crawl', 'Try classic Binondo dishes', NULL, 'Food Crawl', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Heritage Walk', 'Explore historic streets', NULL, 'Heritage', '2 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'Chinese-Filipino Restaurants', 'Dumplings, noodles, and rice dishes', NULL, NULL, NULL, NULL, '₱150–₱500/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Chinese-Filipino Pasalubong', 'Local food products', NULL, NULL, NULL, NULL, NULL, 'Ongpin Shops', NULL),
    (gem_id, 'stays', 0, 'Binondo Hotel', 'Local city accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Binondo Food Tour', 'Guided food and heritage tour', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Book Now');
END $$;

-- ============================================================
-- [40/40] Iloilo Food Trip (Food)
-- ============================================================
DO $$ DECLARE gem_id uuid;
BEGIN
  INSERT INTO public.hidden_gems
    (name, location, category, budget_level, description, tip, images, source, status, is_featured, submitted_by)
  VALUES (
    'Iloilo Food Trip',
    'Iloilo City',
    'Food',
    '₱₱',
    'A culinary destination known for Ilonggo specialties, heritage restaurants, and local delicacies.',
    'Try batchoy and other local specialties.',
    '{}',
    NULL,
    'approved',
    false,
    NULL
  )
  RETURNING id INTO gem_id;

  INSERT INTO public.gem_content_items
    (gem_id, section, sort_order, name, description, distance, tag, duration, category_label, price_range, seller, action_type)
  VALUES
    (gem_id, 'places', 0, 'La Paz Market', 'Local food area', NULL, 'Food Market', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'places', 1, 'Calle Real', 'Historic city street', '2 km', 'Heritage', NULL, NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 0, 'Batchoy Tasting', 'Try Iloilo''s famous noodle soup', NULL, 'Food Tasting', '1 hr', NULL, NULL, NULL, NULL),
    (gem_id, 'activities', 1, 'Food Crawl', 'Explore local specialties', NULL, 'Food Crawl', '3 hrs', NULL, NULL, NULL, NULL),
    (gem_id, 'food', 0, 'La Paz Batchoy House', 'Traditional Ilonggo food', NULL, NULL, NULL, NULL, '₱150–₱400/meal', NULL, NULL),
    (gem_id, 'products', 0, 'Biscocho', 'Popular Iloilo delicacy', NULL, NULL, NULL, NULL, NULL, 'Local Bakeries', NULL),
    (gem_id, 'stays', 0, 'Iloilo City Hotel', 'Central accommodation', NULL, NULL, NULL, 'Hotel', 'From ₱1,500/night', NULL, NULL),
    (gem_id, 'experiences', 0, 'Ilonggo Food Tour', 'Guided local food experience', NULL, NULL, NULL, NULL, '₱1,000/person', NULL, 'Book Now');
END $$;

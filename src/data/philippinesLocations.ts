export interface Region { id: string; name: string; }
export interface Province { id: string; name: string; regionId: string; }
export interface City { id: string; name: string; provinceId: string; }

export const REGIONS: Region[] = [
  { id: "NCR", name: "National Capital Region (NCR)" },
  { id: "CAR", name: "Cordillera Administrative Region (CAR)" },
  { id: "R1",  name: "Region I – Ilocos Region" },
  { id: "R2",  name: "Region II – Cagayan Valley" },
  { id: "R3",  name: "Region III – Central Luzon" },
  { id: "R4A", name: "Region IV-A – CALABARZON" },
  { id: "R4B", name: "Region IV-B – MIMAROPA" },
  { id: "R5",  name: "Region V – Bicol Region" },
  { id: "R6",  name: "Region VI – Western Visayas" },
  { id: "R7",  name: "Region VII – Central Visayas" },
  { id: "R8",  name: "Region VIII – Eastern Visayas" },
  { id: "R9",  name: "Region IX – Zamboanga Peninsula" },
  { id: "R10", name: "Region X – Northern Mindanao" },
  { id: "R11", name: "Region XI – Davao Region" },
  { id: "R12", name: "Region XII – SOCCSKSARGEN" },
  { id: "R13", name: "Region XIII – Caraga" },
  { id: "BARMM", name: "Bangsamoro Autonomous Region (BARMM)" },
];

export const PROVINCES: Province[] = [
  // NCR
  { id: "metro-manila", name: "Metro Manila", regionId: "NCR" },
  // CAR
  { id: "abra", name: "Abra", regionId: "CAR" },
  { id: "apayao", name: "Apayao", regionId: "CAR" },
  { id: "benguet", name: "Benguet", regionId: "CAR" },
  { id: "ifugao", name: "Ifugao", regionId: "CAR" },
  { id: "kalinga", name: "Kalinga", regionId: "CAR" },
  { id: "mt-province", name: "Mountain Province", regionId: "CAR" },
  // Region I
  { id: "ilocos-norte", name: "Ilocos Norte", regionId: "R1" },
  { id: "ilocos-sur", name: "Ilocos Sur", regionId: "R1" },
  { id: "la-union", name: "La Union", regionId: "R1" },
  { id: "pangasinan", name: "Pangasinan", regionId: "R1" },
  // Region II
  { id: "batanes", name: "Batanes", regionId: "R2" },
  { id: "cagayan", name: "Cagayan", regionId: "R2" },
  { id: "isabela", name: "Isabela", regionId: "R2" },
  { id: "nueva-vizcaya", name: "Nueva Vizcaya", regionId: "R2" },
  { id: "quirino", name: "Quirino", regionId: "R2" },
  // Region III
  { id: "aurora", name: "Aurora", regionId: "R3" },
  { id: "bataan", name: "Bataan", regionId: "R3" },
  { id: "bulacan", name: "Bulacan", regionId: "R3" },
  { id: "nueva-ecija", name: "Nueva Ecija", regionId: "R3" },
  { id: "pampanga", name: "Pampanga", regionId: "R3" },
  { id: "tarlac", name: "Tarlac", regionId: "R3" },
  { id: "zambales", name: "Zambales", regionId: "R3" },
  // Region IV-A
  { id: "batangas", name: "Batangas", regionId: "R4A" },
  { id: "cavite", name: "Cavite", regionId: "R4A" },
  { id: "laguna", name: "Laguna", regionId: "R4A" },
  { id: "quezon", name: "Quezon", regionId: "R4A" },
  { id: "rizal", name: "Rizal", regionId: "R4A" },
  // Region IV-B
  { id: "marinduque", name: "Marinduque", regionId: "R4B" },
  { id: "occidental-mindoro", name: "Occidental Mindoro", regionId: "R4B" },
  { id: "oriental-mindoro", name: "Oriental Mindoro", regionId: "R4B" },
  { id: "palawan", name: "Palawan", regionId: "R4B" },
  { id: "romblon", name: "Romblon", regionId: "R4B" },
  // Region V
  { id: "albay", name: "Albay", regionId: "R5" },
  { id: "camarines-norte", name: "Camarines Norte", regionId: "R5" },
  { id: "camarines-sur", name: "Camarines Sur", regionId: "R5" },
  { id: "catanduanes", name: "Catanduanes", regionId: "R5" },
  { id: "masbate", name: "Masbate", regionId: "R5" },
  { id: "sorsogon", name: "Sorsogon", regionId: "R5" },
  // Region VI
  { id: "aklan", name: "Aklan", regionId: "R6" },
  { id: "antique", name: "Antique", regionId: "R6" },
  { id: "capiz", name: "Capiz", regionId: "R6" },
  { id: "guimaras", name: "Guimaras", regionId: "R6" },
  { id: "iloilo", name: "Iloilo", regionId: "R6" },
  { id: "neg-occidental", name: "Negros Occidental", regionId: "R6" },
  // Region VII
  { id: "bohol", name: "Bohol", regionId: "R7" },
  { id: "cebu", name: "Cebu", regionId: "R7" },
  { id: "neg-oriental", name: "Negros Oriental", regionId: "R7" },
  { id: "siquijor", name: "Siquijor", regionId: "R7" },
  // Region VIII
  { id: "biliran", name: "Biliran", regionId: "R8" },
  { id: "eastern-samar", name: "Eastern Samar", regionId: "R8" },
  { id: "leyte", name: "Leyte", regionId: "R8" },
  { id: "northern-samar", name: "Northern Samar", regionId: "R8" },
  { id: "samar", name: "Samar (Western Samar)", regionId: "R8" },
  { id: "southern-leyte", name: "Southern Leyte", regionId: "R8" },
  // Region IX
  { id: "zamboanga-del-norte", name: "Zamboanga del Norte", regionId: "R9" },
  { id: "zamboanga-del-sur", name: "Zamboanga del Sur", regionId: "R9" },
  { id: "zamboanga-sibugay", name: "Zamboanga Sibugay", regionId: "R9" },
  // Region X
  { id: "bukidnon", name: "Bukidnon", regionId: "R10" },
  { id: "camiguin", name: "Camiguin", regionId: "R10" },
  { id: "lanao-del-norte", name: "Lanao del Norte", regionId: "R10" },
  { id: "mis-occidental", name: "Misamis Occidental", regionId: "R10" },
  { id: "mis-oriental", name: "Misamis Oriental", regionId: "R10" },
  // Region XI
  { id: "compostela", name: "Davao de Oro (Compostela Valley)", regionId: "R11" },
  { id: "davao-del-norte", name: "Davao del Norte", regionId: "R11" },
  { id: "davao-del-sur", name: "Davao del Sur", regionId: "R11" },
  { id: "davao-occidental", name: "Davao Occidental", regionId: "R11" },
  { id: "davao-oriental", name: "Davao Oriental", regionId: "R11" },
  // Region XII
  { id: "cotabato", name: "Cotabato (North Cotabato)", regionId: "R12" },
  { id: "sarangani", name: "Sarangani", regionId: "R12" },
  { id: "south-cotabato", name: "South Cotabato", regionId: "R12" },
  { id: "sultan-kudarat", name: "Sultan Kudarat", regionId: "R12" },
  // Region XIII
  { id: "agusan-del-norte", name: "Agusan del Norte", regionId: "R13" },
  { id: "agusan-del-sur", name: "Agusan del Sur", regionId: "R13" },
  { id: "dinagat", name: "Dinagat Islands", regionId: "R13" },
  { id: "surigao-del-norte", name: "Surigao del Norte", regionId: "R13" },
  { id: "surigao-del-sur", name: "Surigao del Sur", regionId: "R13" },
  // BARMM
  { id: "basilan", name: "Basilan", regionId: "BARMM" },
  { id: "lanao-del-sur", name: "Lanao del Sur", regionId: "BARMM" },
  { id: "maguindanao-norte", name: "Maguindanao del Norte", regionId: "BARMM" },
  { id: "maguindanao-sur", name: "Maguindanao del Sur", regionId: "BARMM" },
  { id: "sulu", name: "Sulu", regionId: "BARMM" },
  { id: "tawi-tawi", name: "Tawi-Tawi", regionId: "BARMM" },
];

export const CITIES: City[] = [
  // Metro Manila
  { id: "caloocan", name: "Caloocan City", provinceId: "metro-manila" },
  { id: "las-pinas", name: "Las Piñas City", provinceId: "metro-manila" },
  { id: "makati", name: "Makati City", provinceId: "metro-manila" },
  { id: "malabon", name: "Malabon City", provinceId: "metro-manila" },
  { id: "mandaluyong", name: "Mandaluyong City", provinceId: "metro-manila" },
  { id: "manila", name: "Manila City", provinceId: "metro-manila" },
  { id: "marikina", name: "Marikina City", provinceId: "metro-manila" },
  { id: "muntinlupa", name: "Muntinlupa City", provinceId: "metro-manila" },
  { id: "navotas", name: "Navotas City", provinceId: "metro-manila" },
  { id: "paranaque", name: "Parañaque City", provinceId: "metro-manila" },
  { id: "pasay", name: "Pasay City", provinceId: "metro-manila" },
  { id: "pasig", name: "Pasig City", provinceId: "metro-manila" },
  { id: "pateros", name: "Pateros", provinceId: "metro-manila" },
  { id: "quezon-city", name: "Quezon City", provinceId: "metro-manila" },
  { id: "san-juan", name: "San Juan City", provinceId: "metro-manila" },
  { id: "taguig", name: "Taguig City", provinceId: "metro-manila" },
  { id: "valenzuela", name: "Valenzuela City", provinceId: "metro-manila" },
  // Benguet / CAR
  { id: "baguio", name: "Baguio City", provinceId: "benguet" },
  { id: "la-trinidad", name: "La Trinidad", provinceId: "benguet" },
  { id: "itogon", name: "Itogon", provinceId: "benguet" },
  // Ifugao
  { id: "banaue", name: "Banaue", provinceId: "ifugao" },
  { id: "lagawe", name: "Lagawe", provinceId: "ifugao" },
  // Ilocos Norte
  { id: "laoag", name: "Laoag City", provinceId: "ilocos-norte" },
  { id: "batac", name: "Batac City", provinceId: "ilocos-norte" },
  { id: "pagudpud", name: "Pagudpud", provinceId: "ilocos-norte" },
  // Ilocos Sur
  { id: "vigan", name: "Vigan City", provinceId: "ilocos-sur" },
  { id: "candon", name: "Candon City", provinceId: "ilocos-sur" },
  // La Union
  { id: "san-fernando-lu", name: "San Fernando City", provinceId: "la-union" },
  { id: "san-juan-lu", name: "San Juan (Elyu)", provinceId: "la-union" },
  { id: "bauang", name: "Bauang", provinceId: "la-union" },
  // Pangasinan
  { id: "dagupan", name: "Dagupan City", provinceId: "pangasinan" },
  { id: "alaminos", name: "Alaminos City", provinceId: "pangasinan" },
  { id: "san-carlos", name: "San Carlos City", provinceId: "pangasinan" },
  { id: "urdaneta", name: "Urdaneta City", provinceId: "pangasinan" },
  // Cagayan
  { id: "tuguegarao", name: "Tuguegarao City", provinceId: "cagayan" },
  { id: "aparri", name: "Aparri", provinceId: "cagayan" },
  // Bulacan
  { id: "malolos", name: "Malolos City", provinceId: "bulacan" },
  { id: "meycauayan", name: "Meycauayan City", provinceId: "bulacan" },
  { id: "san-jose-del-monte", name: "San Jose del Monte City", provinceId: "bulacan" },
  { id: "marilao", name: "Marilao", provinceId: "bulacan" },
  // Nueva Ecija
  { id: "cabanatuan", name: "Cabanatuan City", provinceId: "nueva-ecija" },
  { id: "palayan", name: "Palayan City", provinceId: "nueva-ecija" },
  { id: "san-jose-ne", name: "San Jose City", provinceId: "nueva-ecija" },
  // Pampanga
  { id: "san-fernando-pa", name: "San Fernando City", provinceId: "pampanga" },
  { id: "angeles", name: "Angeles City", provinceId: "pampanga" },
  { id: "mabalacat", name: "Mabalacat City", provinceId: "pampanga" },
  // Tarlac
  { id: "tarlac-city", name: "Tarlac City", provinceId: "tarlac" },
  // Zambales
  { id: "olongapo", name: "Olongapo City", provinceId: "zambales" },
  { id: "subic", name: "Subic", provinceId: "zambales" },
  // Batangas
  { id: "batangas-city", name: "Batangas City", provinceId: "batangas" },
  { id: "lipa", name: "Lipa City", provinceId: "batangas" },
  { id: "nasugbu", name: "Nasugbu", provinceId: "batangas" },
  { id: "taal", name: "Taal", provinceId: "batangas" },
  { id: "lobo", name: "Lobo", provinceId: "batangas" },
  // Cavite
  { id: "cavite-city", name: "Cavite City", provinceId: "cavite" },
  { id: "bacoor", name: "Bacoor City", provinceId: "cavite" },
  { id: "dasmariñas", name: "Dasmariñas City", provinceId: "cavite" },
  { id: "general-trias", name: "General Trias City", provinceId: "cavite" },
  { id: "imus", name: "Imus City", provinceId: "cavite" },
  { id: "tagaytay", name: "Tagaytay City", provinceId: "cavite" },
  { id: "trece-martires", name: "Trece Martires City", provinceId: "cavite" },
  // Laguna
  { id: "calamba", name: "Calamba City", provinceId: "laguna" },
  { id: "san-pablo", name: "San Pablo City", provinceId: "laguna" },
  { id: "sta-rosa", name: "Santa Rosa City", provinceId: "laguna" },
  { id: "binan", name: "Biñan City", provinceId: "laguna" },
  { id: "cabuyao", name: "Cabuyao City", provinceId: "laguna" },
  // Rizal
  { id: "antipolo", name: "Antipolo City", provinceId: "rizal" },
  { id: "cainta", name: "Cainta", provinceId: "rizal" },
  { id: "taytay", name: "Taytay", provinceId: "rizal" },
  // Palawan
  { id: "puerto-princesa", name: "Puerto Princesa City", provinceId: "palawan" },
  { id: "el-nido", name: "El Nido", provinceId: "palawan" },
  { id: "coron", name: "Coron", provinceId: "palawan" },
  { id: "san-vicente", name: "San Vicente", provinceId: "palawan" },
  { id: "balabac", name: "Balabac", provinceId: "palawan" },
  // Albay
  { id: "legazpi", name: "Legazpi City", provinceId: "albay" },
  { id: "ligao", name: "Ligao City", provinceId: "albay" },
  { id: "tabaco", name: "Tabaco City", provinceId: "albay" },
  // Camarines Sur
  { id: "naga", name: "Naga City", provinceId: "camarines-sur" },
  { id: "iriga", name: "Iriga City", provinceId: "camarines-sur" },
  // Aklan
  { id: "kalibo", name: "Kalibo", provinceId: "aklan" },
  { id: "boracay-malay", name: "Malay (Boracay)", provinceId: "aklan" },
  // Iloilo
  { id: "iloilo-city", name: "Iloilo City", provinceId: "iloilo" },
  { id: "passi", name: "Passi City", provinceId: "iloilo" },
  // Negros Occidental
  { id: "bacolod", name: "Bacolod City", provinceId: "neg-occidental" },
  { id: "bago", name: "Bago City", provinceId: "neg-occidental" },
  { id: "silay", name: "Silay City", provinceId: "neg-occidental" },
  // Bohol
  { id: "tagbilaran", name: "Tagbilaran City", provinceId: "bohol" },
  { id: "panglao", name: "Panglao", provinceId: "bohol" },
  { id: "alona-beach-town", name: "Dauis (Alona Beach area)", provinceId: "bohol" },
  // Cebu
  { id: "cebu-city", name: "Cebu City", provinceId: "cebu" },
  { id: "lapu-lapu", name: "Lapu-Lapu City", provinceId: "cebu" },
  { id: "mandaue", name: "Mandaue City", provinceId: "cebu" },
  { id: "talisay-cebu", name: "Talisay City", provinceId: "cebu" },
  { id: "toledo", name: "Toledo City", provinceId: "cebu" },
  { id: "carcar", name: "Carcar City", provinceId: "cebu" },
  { id: "moalboal", name: "Moalboal", provinceId: "cebu" },
  { id: "oslob", name: "Oslob (Whale Sharks)", provinceId: "cebu" },
  // Negros Oriental
  { id: "dumaguete", name: "Dumaguete City", provinceId: "neg-oriental" },
  { id: "bais", name: "Bais City", provinceId: "neg-oriental" },
  // Siquijor
  { id: "siquijor-town", name: "Siquijor", provinceId: "siquijor" },
  { id: "san-juan-siq", name: "San Juan", provinceId: "siquijor" },
  // Leyte
  { id: "tacloban", name: "Tacloban City", provinceId: "leyte" },
  { id: "ormoc", name: "Ormoc City", provinceId: "leyte" },
  { id: "baybay", name: "Baybay City", provinceId: "leyte" },
  // Zamboanga del Sur
  { id: "zamboanga-city", name: "Zamboanga City", provinceId: "zamboanga-del-sur" },
  // Misamis Oriental
  { id: "cagayan-de-oro", name: "Cagayan de Oro City", provinceId: "mis-oriental" },
  { id: "el-salvador", name: "El Salvador City", provinceId: "mis-oriental" },
  // Davao del Sur
  { id: "davao-city", name: "Davao City", provinceId: "davao-del-sur" },
  // South Cotabato
  { id: "general-santos", name: "General Santos City", provinceId: "south-cotabato" },
  { id: "koronadal", name: "Koronadal City", provinceId: "south-cotabato" },
  // Agusan del Norte
  { id: "butuan", name: "Butuan City", provinceId: "agusan-del-norte" },
  // Surigao del Norte
  { id: "surigao-city", name: "Surigao City", provinceId: "surigao-del-norte" },
  { id: "siargao-dapa", name: "Dapa (Siargao Island)", provinceId: "surigao-del-norte" },
  { id: "general-luna", name: "General Luna (Siargao)", provinceId: "surigao-del-norte" },
];

interface CustomerRaw {
	success: CustomerData;
}

interface CustomerData {
	id: number;
	company_id: number;
	company_role: object;
	created_by: string | null;
	email: string;
	email1: string | null;
	email2: string | null;
	email3: string | null;
	whatsappnr: string | null;
	pwcode: string | null;
	sessionhash: string | null;
	sessionlifetime: string | null;
	name: string | null;
	firstname: string | null;
	lastname: string | null;
	street: string | null;
	streetno: string | null;
	plz: string | null;
	city: string | null;
	country: string | null;
	isadmin: string | null;
	showsidbar: string | null;
	alarmintervall: number;
	alarmbewegung: number;
	alarmbewegungintervall: number;
	alarmgeschwindigkeit: number;
	alarmgeschwindigkeitab: number;
	alarmgeschwindigkeitintervall: number;
	alarmgeozaunbefahren: number;
	alarmgeozaunbefahrenintervall: number;
	alarmgeozaunverlassen: number;
	alarmgeozaunverlassenintervall: number;
	alarmakkuwarnung: number;
	alarmakkuwarnungab: number;
	alarmakkuwarnungintervall: number;
	createdate: number;
	updatedate: number;
	last_usagedate: string | null;
	expired: string | null;
	show_kmanzeige: number;
	show_gruppenanzeigeanzeige: number;
	actlang: string;
	route_icons: string;
	snap_to_road: number;
	pauses: number;
	map: string;
	distance_unit: string;
	created_at: string | null;
	updated_at: string;
	email_verified_at: string | null;
	customer_img: null;
	notifChannel_sos: string;
	notifChannel_low_battery: string;
	notifChannel_shock: string;
	notifChannel_speed: string;
	notifChannel_leave_area: string;
	notifChannel_ignition: string;
	notifChannel_low_voltage: string;
	notifChannel_enter_area_alert: string;
	notifChannel_leave_area_alert: string;
	notifChannel_drop_alert: string;
	notifChannel_power_cutOff: string;
	private_mode: number;
	route_email: number;
	socket_url: string | null;
	logbook_show_driver: number;
	logbook_show_start_end_point: boolean;
	isActive: number;
	show_pauses: number;
	logbook_unplug_alarm: number;
	email4: string;
	brand: number;
	suppressions: null;
	deleted_at: string | null;
	last_app_activity: string;
	map_types: Array<any>;
	last_password_change: string;
	company: object;
}

interface DeviceRaw {
	success: DeviceData[];
	number_of_records: number;
}

interface DeviceData {
	id: number;
	name: string;
	imei: string;
	model_nr: number;
	devicepos: number;
	deviceshow: number;
	protokoll: string;
	devicezeit: string | null;
	modellid: string | null;
	telefonnummer: null;
	kategorie: string | null;
	speicherdauer: number;
	intervalllaenge: number;
	status: number;
	package: string | null;
	createdate: number;
	updatedate: number;
	spuraktiv: number;
	alarmintervall: number;
	spurmodus: number;
	spurfarbe: string;
	spurpunkte: number;
	spurminuten: number;
	spurdatum: number;
	spurdatumbis: number;
	spursymbolbewegung: number;
	spursymbolpause: number;
	alarmeinstellungenglobal: number;
	alarmbewegung: number;
	alarmbewegungintervall: number;
	alarmgeschwindigkeit: number;
	alarmgeschwindigkeitab: number;
	alarmgeschwindigkeitintervall: number;
	alarmgeozaunbefahren: number;
	alarmgeozaunbefahrenintervall: number;
	alarmgeozaunverlassen: number;
	alarmgeozaunverlassenintervall: number;
	alarmakkuwarnung: number;
	alarmakkuwarnungab: number;
	alarmakkuwarnungintervall: number;
	alarmzuendalarm: number;
	alarm_turn_off: number;
	alarm_volt: number;
	alarm_volt_value: string;
	guard_id: string | null;
	alarmstromunterbrechung: number;
	tagesemail: number;
	alarmbewegunglastmail: number;
	alarmgeschwindigkeitlastmail: number;
	alarmgeozaunbefahrenlastmail: number;
	alarmgeozaunverlassenlastmail: number;
	alarmakkuwarnunglastmail: number;
	alarmakkucounter: number;
	alarmstromunterbrechunglastmail: number;
	alarmzuendalarmlastmail: number;
	alarmzuendalarmlastmailon: number;
	alarmzuendalarmlastmailoff: number;
	iconname: string;
	iconusecustom: number;
	iconcustomimage: string | null;
	radius_meter: number;
	radius_lat: number | null;
	radius_lng: number | null;
	radius_laststatus: number;
	geschwindigkeit_laststatus: number;
	zuend_laststatus: number;
	acc_lastdateunix: number;
	alarmsos: number;
	alarmsoslastmail: number;
	last_dateunix: number | null;
	last_datum: string | null;
	last_uhrzeit: string | null;
	last_lat_symbol: number | null;
	last_lng_symbol: number | null;
	show_kmanzeige: number;
	show_gruppenanzeigeanzeige: number;
	last_serviceport: number;
	stats_speed_active: number;
	timezone: string;
	create_dateunix: number;
	create_dateunix_str: string;
	auto_upd_date: string;
	ac_status: number;
	average_consum: string;
	selected_date_range: string;
	car_id: number;
	private_mode: number;
	carDevice_id: number;
	alarm_geofence: number;
	setup_done: boolean;
	privacy_mode: number;
	share_link: boolean;
	loadroute: 0,
	note: string | null;
	note_color: string | null;
	threedModel_name: string | null;
	threedModel_color: string | null;
	deleted_at: string | null;
	category_id: number | null;
	alarm_enabled: number;
	live_tracking_start_time: number | null;
	live_tracking_duration: number | null;
	logbook_access: number;
	route_profile: DeviceRouteProfile[];
	route_accuracy: number | null;
	activity_daily_goal: number | null;
	extended_alarm_sos: number;
	alarm_fall_enabled: number;
	subAccounts: DeviceSubAccounts[];
	customImgUrl: string;
	device_models: DeviceDeviceModels[];
	appmode: null
}

interface ManualLinkMap {
	de?: string;
	en?: string;
	[lang: string]: string | undefined;
}

interface DeviceModel {
	manual_link?: string | ManualLinkMap | null;
	// Add other properties as needed
}

interface Device {
	device_models?: DeviceModel[];
	// Add other properties as needed
}

interface CarDataRaw {
	success: CarData[];
}

interface CarData {
	id: number;
	car_id: number;
	car_name: string;
	model_id: number;
	model_name: string;
	license_plate: string;
	plate_id: string;
	iddevice: number;
	customer_id: number;
	mileage: string;
	mileage_repeat: string;
	optimized_mileage: string;
	default_driver: number | null;
	default_reason_for_private_route: null;
	default_reason_for_toWork_route: null;
	default_reason_for_bussiness_route: null;
	default_reason_for_mix_route: null;
	stop_time: number;
	created_at: string;
	updated_at: string;
	active: number;
	edit_logbook_routes: number;
	last_export_start_date: null;
	last_export_end_date: null;
	tire_brand: null;
	tire_name: null;
	front_tire_range: null;
	rear_tire_range: null;
	load_index: null;
	speed_rating: null;
	tire_season: null;
	tire_depth: null;
	tire_year: null;
	deleted_at: null;
	driver: null;
	device: object;
	carDevice_id: number;
}

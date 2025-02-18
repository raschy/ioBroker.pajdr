interface FileHandler {
	path: string;
	file: string;
}

interface DeviceDataResponse {
	// Define the structure of the device data response here
	data: string;
	success: {
		id: number;
	};
}

interface CustomerRaw {
	success: Customer;
}

interface Customer {
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
	map_types: Array;
	last_password_change: string;
	company: object;
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
	customer_id: number;
}

interface TracksRaw {
	success: Track[];
}

interface Track {
	id: string;
	lat: number;
	lng: number;
	direction: number;
	dateunix: number;
	battery: number;
	speed: number;
	iddevice: number;
	steps: number;
	heartbeat: number;
	accuracy: number;
	wifi: null;
	note: null;
	upt: null;
}

interface GeoFencesRaw {
	success: GeoFence[];
}

interface GeoFence {
	id: number;
	iddevice: number;
	name: string;
	geodata: string | null;
	status: number;
	shape_type: number;
	coordinates: Array;
	options: object;
	createdate: string | null;
	updatedate: string | null;
	trigger_enter: number;
	trigger_leave: number;
	deleted_at: string | null;
	created_at: string | null;
	updated_at: string | null;
	sound_enter: number;
	sound_leave: number;
}

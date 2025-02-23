import { performQuery } from ".";

const getNodesQuery = `SELECT
	nodes.*,
	buildings.address AS building,
	json_agg(json_build_object('id', devices.id, 'type', device_types, 'lat', devices.lat, 'lng', devices.lng, 'alt', devices.alt, 'azimuth', devices.azimuth, 'status', devices.status, 'name', devices.name, 'ssid', devices.ssid, 'notes', devices.notes, 'create_date', devices.create_date, 'abandon_date', devices.abandon_date)) AS devices
FROM
	nodes
	LEFT JOIN buildings ON nodes.building_id = buildings.id
	LEFT JOIN devices ON nodes.id = devices.node_id
	LEFT JOIN device_types ON device_types.id IN (devices.device_type_id)
	LEFT JOIN requests ON requests.building_id = buildings.id
	LEFT JOIN panoramas ON panoramas.request_id = requests.id
GROUP BY
	nodes.id,
	buildings.id
ORDER BY
	nodes.create_date DESC`;

const getNodeQuery = `SELECT
	nodes.*,
	to_json(buildings) AS building,
	to_json(members) AS member
FROM
	nodes
	LEFT JOIN buildings ON nodes.building_id = buildings.id
	LEFT JOIN members ON nodes.member_id = members.id
WHERE
	nodes.id = $1
GROUP BY
	nodes.id,
	buildings.id,
	members.id`;

const createNodeQuery = `INSERT INTO nodes (lat, lng, alt, name, notes, create_date, abandoned)
	VALUES($1, $2, $3, $4, $5, $6, $7)`;

export async function getNodes() {
	return performQuery(getNodesQuery);
}

export async function getNode(id) {
	if (!Number.isInteger(parseInt(id, 10))) throw new Error("Bad params");
	const [node] = await performQuery(getNodeQuery, [id]);
	if (!node) throw Error("Not found");
	return node;
}

async function createNode(node) {
	const { lat, lng, alt, name, notes, create_date, abandoned } = node;
	const create_date_date = new Date(create_date);
	const abandon_date = abandoned ? new Date(abandoned) : null;
	const values = [lat, lng, alt, name, notes, create_date_date, abandon_date];
	await performQuery(createNodeQuery, values);
	return getNode(event.body.id);
}

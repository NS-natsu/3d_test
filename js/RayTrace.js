const FOV_W = 1.4;
const FOV_H = 0.8;

function searchforward(origin, ray, dist, expectPoly){
	let d = new vector3(0, 0, 0);
	for(const b of block){
		for(const polyNum of b.polys){
			const poly = Polygons.polys[polyNum];
			if(expectPoly === poly) continue;
			const det = -innerproduct(poly.normal, ray);

			if(det === 0){
				continue;
			}

			const base = poly.getBase();
			d.moveto(
				origin.x - Coords.x[b.offset] - base.x,
				origin.y - Coords.y[b.offset] - base.y,
				origin.z - Coords.z[b.offset] - base.z
			);

			const t = innerproduct(poly.normal, d) / det;
			if(dist <= t) continue;

			const u = -detMat(d, poly.line2, ray) / det;
			if(u < 0 || 1 < u) continue;
			const v = -detMat(poly.line1, d, ray) / det;
			if(v < 0 || 1 < u + v) continue;
			return true;
		}
	}
	return false;
}

function rayTracing_field(imagebuff){
	const pX = camera.getPos().x;
	const pY = camera.getPos().y;
	const pZ = camera.getPos().z;

	const pRay = camera.getRay();
	const pRight = camera.getRight();
	const top = camera.getTop();

	const fields = new Array();

	let d = new vector3(0, 0, 0);
	let ray = new vector3(0, 0, 0);

	for(const b of block){
		for(const polyNum of b.polys){
			const poly = Polygons.polys[polyNum];
			if(poly.type != 'field') continue;
			const base = poly.getBase();
			d.moveto(
				pX - Coords.x[b.offset] - base.x,
				pY - Coords.y[b.offset] - base.y,
				pZ - Coords.z[b.offset] - base.z
			);
			fields.push({poly : poly,
							dist : innerproduct(poly.normal, d),
							l1 : crossproduct(d, poly.line2),
							l2 : crossproduct(poly.line1, d)});
		}
	}
	for(let i = 0; i < can_h; i++){
		const tanH = Math.tan(FOV_H / 2 - i * FOV_H / (can_h - 1));
		for(let j = 0; j < can_w; j++){
			const pos = i * can_w + j;
			const tanW = Math.tan(FOV_W / 2 - j * FOV_W / (can_w - 1));
			ray.moveto(
				pRay.x - pRight.x * tanW + top.x * tanH,
				pRay.y - pRight.y * tanW + top.y * tanH,
				pRay.z - pRight.z * tanW + top.z * tanH
			).unitization();

			for(const field of fields){
				const det = -innerproduct(field.poly.normal, ray);
				if(det === 0){
					continue;
				}

				if(field.poly.maskSide != 'both' && det < 0){
					continue;
				}

				const t = field.dist / det;
				if(t <= 0) continue;
				if(imagebuff[pos] === undefined){
					imagebuff[pos] = {
						dist: t,
						dst_l1: -innerproduct(field.l1, ray) / det,
						dst_l2: -innerproduct(field.l2, ray) / det,
						pos: new vector3(
							pX + t * ray.x,
							pY + t * ray.y,
							pZ + t * ray.z
						),
						poly: field.poly
					}
				} else if(t <= imagebuff[pos].dist){
					imagebuff[pos].dst_l1 = -innerproduct(field.l1, ray) / det;
					imagebuff[pos].dst_l2 = -innerproduct(field.l2, ray) / det;
					imagebuff[pos].dist = t;
					imagebuff[pos].poly = field.poly;
					imagebuff[pos].pos.moveto(
						pX + t * ray.x,
						pY + t * ray.y,
						pZ + t * ray.z
					);
				}
			}
		}
	}
}

function rays_casting(buffer, objs, width, height){
	const pPos = camera.getPos();

	const SCRLT = camera.getScreen(0);
	const SCRRT = camera.getScreen(1);
	const SCRLB = camera.getScreen(2);

	SCRRT.x -= SCRLT.x;
	SCRRT.y -= SCRLT.y;
	SCRRT.z -= SCRLT.z;

	SCRLB.x -= SCRLT.x;
	SCRLB.y -= SCRLT.y;
	SCRLB.z -= SCRLT.z;

	const w = 480, h = 360;

	SCRRT.x /= can_w;
	SCRRT.y /= can_w;
	SCRRT.z /= can_w;

	SCRLB.x /= can_h;
	SCRLB.y /= can_h;
	SCRLB.z /= can_h;

	const ray = new vector3(0, 0, 0);/*{
		x: 0,
		y: 0,
		z: 0
	};*/

	let pos = -1;
	for(let y = 0; y <= can_h; y++){
		ray.x = SCRLT.x + (y * SCRLB.x) - pPos.x;
		ray.y = SCRLT.y + (y * SCRLB.y) - pPos.y;
		ray.z = SCRLT.z + (y * SCRLB.z) - pPos.z;
		for(let x = 0; x <= can_w; x++){
			pos += 1;
			ray.x += SCRRT.x;
			ray.y += SCRRT.y;
			ray.z += SCRRT.z;

			for(let i = objs.length - 1; 0 <= i; i--){
				const obj = objs[i];
				const poly = obj.poly;
				const det = -innerproduct(poly.normal, ray);
				if(det === 0){
					continue;
				}
				if(poly.maskSide != 'both' && det < 0){
					continue;
				}

				const t = obj.dist / det;
				if(t <= 0) continue;

				const u = -innerproduct(obj.l1, ray) / det;
				if(obj.poly.type != 'field'){
					if(u < 0 || 1 < u) continue;
				}

				const v = -innerproduct(obj.l2, ray) / det;
				if(obj.poly.type != 'field'){
					if(v < 0 || 1 < v) continue;
					if(obj.poly.type == 'tri' && 1 < (u + v)) continue;
				}

				if(buffer[pos] === undefined){
					buffer[pos] = {
						dist: t,
						dst_l1: u,
						dst_l2: v,
						pos: new vector3(
							pPos.x + t * ray.x,
							pPos.y + t * ray.y,
							pPos.z + t * ray.z
						),
						poly: obj.poly
					}
				} else if(t <= buffer[pos].dist){
					buffer[pos].dist = t;
					buffer[pos].dst_l1 = u;
					buffer[pos].dst_l2 = v;
					buffer[pos].pos.moveto(
						pPos.x + t * ray.x,
						pPos.y + t * ray.y,
						pPos.z + t * ray.z
					);
					buffer[pos].poly = obj.poly;
				}
			}
		}
	}
}
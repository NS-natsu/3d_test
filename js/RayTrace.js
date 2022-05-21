const FOV_W = 1.4;
const FOV_H = 0.8;

function searchforward(origin, ray, dist, expectPoly){
	const d = {x: 0, y: 0, z: 0};
	for(const b of block){
		for(const polyNum of b.polys){
			const poly = Polygons.polys[polyNum];
			if(expectPoly === poly) continue;

			const det = -innerproduct(poly.normal, ray);
			if(det === 0){
				continue;
			}

			const base = poly.getBase();
			d.x = origin.x - Coords.x[b.offset] - base.x;
			d.y = origin.y - Coords.y[b.offset] - base.y;
			d.z = origin.z - Coords.z[b.offset] - base.z;

			const t = innerproduct(poly.normal, d) / det;
			if(dist <= t) continue;

			const u = -detMat(d, poly.line2, ray) / det;
			if(poly.type !== 'field'){
				if(u < 0 || 1 < u) continue;
			}

			const v = -detMat(poly.line1, d, ray) / det;
			if(poly.type !== 'field'){
				if(v < 0 || 1 < v) continue;
				if(poly.type === 'tri' && 1 < (u + v)) continue;
			}
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

	let tmp = camera.getScreen(0);
	let startX = tmp.x;
	let startY = tmp.y;
	let startZ = tmp.z;

	tmp = camera.getScreen(1);
	let stepW_X = (tmp.x - startX) / (can_w-1);
	let stepW_Y = (tmp.y - startY) / (can_w-1);
	let stepW_Z = (tmp.z - startZ) / (can_w-1);

	tmp = camera.getScreen(2);
	let stepH_X = (tmp.x - startX) / (can_h-1);
	let stepH_Y = (tmp.y - startY) / (can_h-1);
	let stepH_Z = (tmp.z - startZ) / (can_h-1);

	startX += (can_w-1) * stepW_X - pPos.x;
	startY += (can_w-1) * stepW_Y - pPos.y;
	startZ += (can_w-1) * stepW_Z - pPos.z;

	stepH_X -= can_w * stepW_X;
	stepH_Y -= can_w * stepW_Y;
	stepH_Z -= can_w * stepW_Z;

	for(let i = objs.length - 1; 0 <= i; i--){
		const obj = objs[i];
		const poly = Polygons.polys[obj.polyNum];

		const normal = poly.normal;

		const isBoth = (poly.maskSide === 'both');
		const isField = (poly.type === 'field');
		const isTri = (poly.type === 'tri')

		const ray = /*new vector3(startX, startY, startZ);*/{
			x: startX,
			y: startY,
			z: startZ
		};

		let pos = -1;
		buffer.LookAt(buffer.size() - 1);
		for(let y = can_h; 0 < y; y--){
			ray.x += stepH_X;
			ray.y += stepH_Y;
			ray.z += stepH_Z;
			for(let x = can_w; 0 < x; x--){
				pos++;
				ray.x += stepW_X;
				ray.y += stepW_Y;
				ray.z += stepW_Z;

				buffer.next();

				const det = -innerproduct(normal, ray);
				if(det === 0){
					continue;
				}
				if(!isBoth && det < 0){
					continue;
				}

				const t = obj.dist / det;
				if(t <= 0) continue;

				const u = -innerproduct(obj.l1, ray) / det;
				if(!isField){
					if(u < 0 || 1 < u) continue;
				}

				const v = -innerproduct(obj.l2, ray) / det;
				if(!isField){
					if(v < 0 || 1 < v) continue;
					if(isTri && 1 < (u + v)) continue;
				}

				if(t <= buffer.getDist()){
					buffer.setData(
						t, u, v,
						pPos.x + t * ray.x,
						pPos.y + t * ray.y,
						pPos.z + t * ray.z,
						Polygons.indexOf(poly)
					);
				}
			}
		}
	}
}

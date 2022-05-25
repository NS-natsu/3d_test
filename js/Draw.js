let calc_Right = false;
let pixels;

function setDrawData(data){
	const pPos = camera.getPos();
	const light = new vector3(3, 10, -5);
	const ambient = 20;

	let point = new vector3(0, 0, 0);
	let ray = new vector3(0, 0, 0);


	const threshold = Math.cos((3 * 2 * Math.PI) / 360);

	let base = -4;
	data.LookAt(data.size() - 1);
	for(let i = data.size(); 0 < i; i--){
		base += 4;
		data.next();
		const polyNum = data.getPolyNum();
		if(polyNum === -1){
			continue;
		}
		const poly = Polygons.polys[polyNum];
		const dst_l1 = data.getDistL1();
		const dst_l2 = data.getDistL2();
		const pos = data.getPos();
	/*for(let y = 0; y < can_h; y++){
		for(let x = 0; x < can_w; x++){*/
		//const datum =  data[y * can_w + x];
		//const base = (y * img_w + x) * 4;

		if(poly.type === 'field'){
			let colSlct = (Math.floor(dst_l1) + Math.floor(dst_l2));
			poly.col = ((colSlct & 1) === 1) ? 0xffffffff : 0xff222222;
		}

		
		pixels[base + 0] = (poly.col >>> 16) & 0xff;
		pixels[base + 1] = (poly.col >>> 8) & 0xff;
		pixels[base + 2] = poly.col & 0xff;
		pixels[base + 3] = (poly.col >>> 24) & 0xff;
		if(!calc_Right) continue;/**/

		let diffuse = 0;

		//光源からの方向
		let normal = poly.normal.clone().unitization();

		ray.moveto(
			pos.x - pPos.x,
			pos.y - pPos.y,
			pos.z - pPos.z
		);

		point.moveto(
			pos.x - light.x,
			pos.y - light.y,
			pos.z - light.z
		);

		const pointSize = point.getSize();
		point.unitization();

		let isForward = searchforward(light, point, pointSize, poly);
		if(isForward === false && 0 <= innerproduct(ray, normal) * innerproduct(point, normal)){
			diffuse = -innerproduct(point, normal) * (100 - ambient);
			if(poly.maskSide === 'both') diffuse = Math.abs(diffuse);
			else if(diffuse < 0) diffuse = 0;
		}

		pixels[base + 0] = (poly.col >>> 16) & 0xff;
		pixels[base + 1] = (poly.col >>> 8) & 0xff;
		pixels[base + 2] = poly.col & 0xff;
		pixels[base + 3] = (poly.col >>> 24) & 0xff;

		pixels[base + 0] *= (ambient + diffuse) / 100;
		pixels[base + 1] *= (ambient + diffuse) / 100;
		pixels[base + 2] *= (ambient + diffuse) / 100;

		//continue;

		//鏡面光 とりあえず視線が完全に反射すると仮定して反射したベクトルが光源に向かうかを調べる
		let n = innerproduct(normal, ray) * 2;

		ray.x -= n * normal.x;
		ray.y -= n * normal.y;
		ray.z -= n * normal.z;

		ray.unitization();

		let specular = 0;
		if(isForward === false) specular = -innerproduct(ray, point);

		if(threshold < specular) {
			specular = (specular - threshold) / (1 - threshold);
			let strong = pixels[base + 0] + 255 * specular * specular;
			pixels[base + 0] = (255 < strong) ? 255 : strong;

			strong = pixels[base + 1] + 255 * specular * specular;
			pixels[base + 1] = (255 < strong) ? 255 : strong;
			
			strong = pixels[base + 2] + 255 * specular * specular;
			pixels[base + 2] = (255 < strong) ? 255 : strong;
		}
	}
		/*}
	}*/
}

class Buffer {
	#data;
	#itr;
	#max;
	constructor(size){
		this.#max = size - 1;
		this.#data = new Float32Array(size * 8);
		this.#itr = 0;
	}
	LookAt(n){
		if(n < 0 || this.#max < n){
			return;
		}

		this.#itr = n;
		return this;
	}
	next(){
		if(this.#itr < this.#max){
			this.#itr += 1;
		} else {
			this.#itr = 0;
		}
	}

	setData(d, l1, l2, x, y, z, pnum){
		const offset = this.#itr << 3;
		this.#data[offset + 0] = d;
		this.#data[offset + 1] = l1;
		this.#data[offset + 2] = l2;
		this.#data[offset + 3] = x;
		this.#data[offset + 4] = y;
		this.#data[offset + 5] = z;
		this.#data[offset + 6] = pnum;
	}

	formatData(d, l1, l2, x, y, z, pnum){
		let offset = -8;
		for(let cnt = this.#max; 0 <= cnt; cnt--){
			offset += 8;
			this.#data[offset + 0] = d;
			this.#data[offset + 1] = l1;
			this.#data[offset + 2] = l2;
			this.#data[offset + 3] = x;
			this.#data[offset + 4] = y;
			this.#data[offset + 5] = z;
			this.#data[offset + 6] = pnum;
		}
	}

	getDist(){
		return this.#data[(this.#itr << 3) + 0];
	}

	getDistL1(){
		return this.#data[(this.#itr << 3) + 1];
	}

	getDistL2(){
		return this.#data[(this.#itr << 3) + 2];
	}

	getPosX(){
		return this.#data[(this.#itr << 3) + 3];
	}

	getPosY(){
		return this.#data[(this.#itr << 3) + 4];
	}

	getPosZ(){
		return this.#data[(this.#itr << 3) + 5];
	}

	getPos(){
		return {
			x: this.getPosX(),
			y: this.getPosY(),
			z: this.getPosZ()
		};
	}

	getPolyNum(){
		return this.#data[(this.#itr << 3) + 6] | 0;
	}

	size() {
		return this.#max + 1;
	}
}

class CollisionDetection {
	#data;
	#length;
	constructor(objects, point){
		const fields = new Array();
		let d = new vector3(0, 0, 0);
		for(let i = objects.length - 1; 0 <= i; i--){
			const b = objects[i];
			const offset = b.offset;
			for(let j = b.polys.length - 1; 0 <= j; j--){
				const polyNum = b.polys[j];
				const poly = Polygons.polys[polyNum];
				const base = poly.getBase();
				d.moveto(
					point.x - Coords.x[offset] - base.x,
					point.y - Coords.y[offset] - base.y,
					point.z - Coords.z[offset] - base.z
				);
				fields.push({polyNum : polyNum,
								dist : innerproduct(poly.normal, d),
								l1 : crossproduct(d, poly.line2),
								l2 : crossproduct(poly.line1, d)});
			}
		}

		this.#data = new Float32Array(fields.length*8);
		for(let i = 0; i < fields.length; i++){
			const offset = i << 3;
			this.#data[offset + 0] = fields[i].polyNum;
			this.#data[offset + 1] = fields[i].dist;
			this.#data[offset + 2] = fields[i].l1.x;
			this.#data[offset + 3] = fields[i].l1.y;
			this.#data[offset + 4] = fields[i].l1.z;
			this.#data[offset + 5] = fields[i].l2.x;
			this.#data[offset + 6] = fields[i].l2.y;
			this.#data[offset + 7] = fields[i].l2.z;
		}

		this.#length = fields.length;
	}

	getSize(){
		return this.#length;
	}

	getData(n){
		if(n < 0 || this.#length <= n){
			n = 0;
		}
		n <<= 3;
		return {
				polyNum : this.#data[n + 0],
				dist : this.#data[n + 1],
				l1 : {	x:this.#data[n + 2],
						y:this.#data[n + 3],
						z:this.#data[n + 4]
					},
				l2 : {	x:this.#data[n + 5],
						y:this.#data[n + 6],
						z:this.#data[n + 7]
					}
			};
	}
}

function draw(){
	ctx.clearRect(0, 0, can_w, can_h);

	ctx.strokeStyle = 'black';
	ctx.fillRect(0, 0, can_w, can_h);
	let imageData = ctx.getImageData(0, 0, can_w, can_h);
	//let imageDataBuff = new Array(can_w*can_h);
	img_w = imageData.width;
	pixels = imageData.data;

	const pPos = camera.getPos();

	const pRay = camera.getRay();
	const pRight = camera.getRight();
	const top = camera.getTop();

	let ray = new vector3(0, 0, 0);
	let d = new vector3(0, 0, 0);

	const argRayW = Math.tan(FOV_W / 2);
	const argRayH = Math.tan(FOV_H / 2);

	const correctW = can_w / FOV_W;
	const correctH = can_h / FOV_H;

	const fields = new Array();

	for(let i = block.length - 1; 0 <= i; i--){
		const b = block[i];
		const offset = b.offset;
		for(let j = b.polys.length - 1; 0 <= j; j--){
			const polyNum = b.polys[j];
			const poly = Polygons.polys[polyNum];
			const base = poly.getBase();
			d.moveto(
				pPos.x - Coords.x[offset] - base.x,
				pPos.y - Coords.y[offset] - base.y,
				pPos.z - Coords.z[offset] - base.z
			);
			fields.push({polyNum : polyNum,
							dist : innerproduct(poly.normal, d),
							l1 : crossproduct(d, poly.line2),
							l2 : crossproduct(poly.line1, d)});
		}
	}/**/

	//const fields = new CollisionDetection(block, pPos);

	const dist = camera.getMaxDist();
	const imageDataBuff = new Buffer(can_w*can_h);
	imageDataBuff.formatData(dist, 0, 0, 0, 0, 0, -1);

	rays_casting(imageDataBuff, fields);

	/*rayTracing_field(imageDataBuff);*/

	setDrawData(imageDataBuff);

	ctx.putImageData(imageData, 0, 0);
	return;
	for(const b of block){
		for(const polyNum of b.polys){
			const poly = Polygons.polys[polyNum];
			if(poly.type === 'field') continue;
			const base = poly.getBase();
			d.moveto(
				pPos.x - Coords.x[b.offset] - base.x,
				pPos.y - Coords.y[b.offset] - base.y,
				pPos.z - Coords.z[b.offset] - base.z
			);

			//if(detMat_fast(poly.line1.x , poly.line1.y, poly.line1.z,
			//	poly.line2.x, poly.line2.y, poly.line2.z,
			//	d.x, d.y, d.z) <= 0){
			const args = innerproduct(d, poly.normal);

			if(args === 0){
				continue;
			}

			if(poly.maskSide != 'both' && args < 0){
				continue;
			}

			for(let u = resolution; 0 <= u; u--){
				let v = resolution;
				if(poly.type === 'tri'){
					v -= u;
				}
				for(; 0 <= v; v--){
					const _u = u / resolution;
					const _v = v / resolution;

					let intersects = {
						dist: 0,
						dst_l1: _u,
						dst_l2: _v,
						pos: null,
						poly: null
					};

					ray.moveto(
						Coords.x[b.offset] + base.x + _u * poly.line1.x + _v * poly.line2.x - pX,
						Coords.y[b.offset] + base.y + _u * poly.line1.y + _v * poly.line2.y - pY,
						Coords.z[b.offset] + base.z + _u * poly.line1.z + _v * poly.line2.z - pZ
					).unitization();

					const correction = innerproduct(ray, pRay);
					if(correction < 0) continue;

					const argH = innerproduct(ray, top) / correction;
					if(((argH < 0) ? -argH : argH) > argRayH) continue;

					const argW = innerproduct(ray, pRight) / correction;
					if(((argW < 0) ? -argW : argW) > argRayW) continue;

					/*const det = detMat_fast(tri.line1.x , tri.line1.y, tri.line1.z,
									tri.line2.x, tri.line2.y, tri.line2.z,
									-ray.x, -ray.y, -ray.z);*/
					const det = -innerproduct(ray, poly.normal);

					/*const t = detMat_fast(
								tri.line1.x , tri.line1.y, tri.line1.z,
								tri.line2.x, tri.line2.y, tri.line2.z,
								d.x, d.y, d.z) / det;*/

					const t = args / det;
					if(t <= 0) continue;

					const diffW = (Math.atan(argW) + (FOV_W / 2)) * correctW;// + 0.5; いらなかった
					const diffH = ((FOV_H / 2) - Math.atan(argH)) * correctH;// + 0.5;

					const pnt = (diffH >> 0) * can_w + (diffW >> 0); // num | 0 == floor(num)
					if(imageDataBuff[pnt] === undefined || t <= imageDataBuff[pnt].dist){
						intersects.dist = t;
						intersects.poly = poly;
						intersects.pos = new vector3(
							pX + t * ray.x,
							pY + t * ray.y,
							pZ + t * ray.z
						);
						imageDataBuff[pnt] = intersects;
						//imageDataBuff[pnt] = {
						//	dist: t,
						//	dst_l1: _u,
						//	dst_l2: _v,
						//	pos: new vector3(
						//			camera.pos.x + t * ray.x,
						//			camera.pos.y + t * ray.y,
						//			camera.pos.z + t * ray.z
						//		),
						//	tri: tri
						//};
					}
				}
			}
		}
	}

	rayTracing_field(imageDataBuff);

}
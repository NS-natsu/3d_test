function setDrawData(data){
	const light = new vector3(3, 10, -5);
	const ambient = 20;

	let point = new vector3(0, 0, 0);
	let ray = new vector3(0, 0, 0);


	const threshold = Math.cos((3 * 2 * Math.PI) / 360);

	let base = -4;
	for(const datum of data){
	/*for(let y = 0; y < can_h; y++){
		for(let x = 0; x < can_w; x++){*/
		//const datum =  data[y * can_w + x];
		//const base = (y * img_w + x) * 4;
		base += 4;
		if(datum === undefined) {
			continue;
		}

		if(datum.poly.type === 'field'){
			let colSlct = (Math.floor(datum.dst_l1) + Math.floor(datum.dst_l2));
			datum.poly.col = ((colSlct & 1) === 1) ? 0xffffffff : 0xff222222;
		}

		
		/*pixels[base + 0] = (datum.poly.col >>> 16) & 0xff;
		pixels[base + 1] = (datum.poly.col >>> 8) & 0xff;
		pixels[base + 2] = datum.poly.col & 0xff;
		pixels[base + 3] = (datum.poly.col >>> 24) & 0xff;
		continue;*/

		let diffuse = 0;

		//光源からの方向
		let normal = datum.poly.normal.clone().unitization();

		ray.moveto(
			datum.pos.x - camera.pos.x,
			datum.pos.y - camera.pos.y,
			datum.pos.z - camera.pos.z
		);

		point.moveto(
			datum.pos.x - light.x,
			datum.pos.y - light.y,
			datum.pos.z - light.z
		);

		const pointSize = point.getSize();
		point.unitization();

		let isForward = searchforward(light, point, pointSize, datum.poly);
		if(isForward === false && 0 <= innerproduct(ray, normal) * innerproduct(point, normal)){
			diffuse = -innerproduct(point, normal) * (100 - ambient);
			if(datum.poly.maskSide === 'both') diffuse = Math.abs(diffuse);
			else if(diffuse < 0) diffuse = 0;
		}

		//鏡面光 とりあえず視線が完全に反射すると仮定して反射したベクトルが光源に向かうかを調べる
		let n = innerproduct(normal, ray) * 2;

		ray.x -= n * normal.x;
		ray.y -= n * normal.y;
		ray.z -= n * normal.z;

		ray.unitization();

		let specular = 0;
		if(isForward === false) specular = -innerproduct(ray, point);

		pixels[base + 0] = (datum.poly.col >>> 16) & 0xff;
		pixels[base + 1] = (datum.poly.col >>> 8) & 0xff;
		pixels[base + 2] = datum.poly.col & 0xff;
		pixels[base + 3] = (datum.poly.col >>> 24) & 0xff;

		pixels[base + 0] *= (ambient + diffuse) / 100;
		pixels[base + 1] *= (ambient + diffuse) / 100;
		pixels[base + 2] *= (ambient + diffuse) / 100;

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

function draw(){
	ctx.clearRect(0, 0, can_w, can_h);

	ctx.strokeStyle = 'black';
	ctx.fillRect(0, 0, can_w, can_h);
	let imageData = ctx.getImageData(0, 0, can_w, can_h);
	let imageDataBuff = new Array(can_w*can_h);
	img_w = imageData.width;
	pixels = imageData.data;

	const resolution = 200;

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
			fields.push({poly : poly,
							dist : innerproduct(poly.normal, d),
							l1 : crossproduct(d, poly.line2),
							l2 : crossproduct(poly.line1, d)});
		}
	}
	rays_casting(imageDataBuff, fields);

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

	setDrawData(imageDataBuff);

	ctx.putImageData(imageData, 0, 0);
}
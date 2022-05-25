const LineGraph = {
	ctx : document.getElementById("myLineChart"),
	max : 0,
	min : 0,
	ave : 0,
	dataSize : 50,
	list : new Array(),

	addData : function(data) {
		this.list.push(data);/*
		if(this.list.length === 1){
			this.max = this.min = this.list[0];
		}
		if(this.max < this.list[this.list.length - 1]){
			this.max = this.list[this.list.length - 1]
		}
		if(this.min > this.list[this.list.length - 1]){
			this.min = this.list[this.list.length - 1]
		}*/
		while(this.dataSize < this.list.length){
			this.list.shift();
		}

		this.ave = 0;
		this.max = this.min = this.list[0];
		for(let i = 0; i < this.list.length; i++){
			this.ave += this.list[i];
			if(this.max < this.list[i]){
				this.max = this.list[i];
			}

			if(this.min > this.list[i]){
				this.min = this.list[i];
			}
		}
		this.ave /= this.list.length;
	},

	draw : function(){
		const max = (this.max - this.min) < 50 ? this.min + 50 : this.max;
		const labels = new Array();
		for(let i = 1; i <= this.dataSize; i++){
			labels.push("" + i);
		}
		var myLineChart = new Chart(this.ctx, {
			type : 'line',
			data : {
				labels : labels,
				datasets : [
					{
						label : '実行速度',
						data : this.list.slice(),
						borderColor : "rgba(255, 0, 0, 1)",
						backgroundColor : "rgba(0, 0, 0, 0)"
					}
				]
			},
			options : {
				title : {
					display : true,
					text : '平均:' + this.ave
				},
				scales : {
					yAxes : [{
						ticks : {
							suggestedMax : max,
							suggestedMin : this.min,
							stepSize : (max - this.min) / 10,
							callback : function(value, index, values){
								return value;
							}
						}
					}]
				}
			}
		})
	}
};
const puppeteer = require('puppeteer');
var readlineSync = require('readline-sync');


async function start () {
	
	const tribunal = readlineSync.question('Qual o seu tribunal? (tjrn ou jfrn) ');
	
	console.log(`Pronto! Uma página se abrirá. 
Nela, peço que efetue o login no seu PJE e mude para o perfil do procurador.
Feito isso, aguarde enquanto preparo o ambiente.
:)`);
	
	let browser = await puppeteer.launch({headless: false});
	let page = await browser.newPage();
	
	switch (tribunal) {
		case "tjrn":
			
			await page.goto('https://pje1g.tjrn.jus.br/pje/login.seam');
			
			await page.waitForNavigation();

			await page.waitForTimeout(10000);

			var cookiesTjrn = await page.evaluate(() => {
				return {
					ROUTER_ID: getCookie("ROUTER_ID").split('=')[1],
					JSESSIONID: getCookie("JSESSIONID").split('=')[1]
				}
			});

			await browser.close();

			// ação 1
			login (tribunal, cookiesTjrn, 
				(page) => {
				searchProcess(page);
			});


			break;
		
		case "jfrn":

			await page.goto('https://pje.jfrn.jus.br/pje/login.seam');
			
			await page.waitForNavigation();

			await page.waitForTimeout(20000);
			
			var cookiesJfrn = await page.evaluate(() => {
				var c_name = "JSESSIONID";
				if (document.cookie.length > 0) {
					c_start = document.cookie.indexOf(c_name + "=");
					if (c_start != -1) {
						c_start = c_start + c_name.length + 1;
						c_end = document.cookie.indexOf(";", c_start);
						if (c_end == -1) {
							c_end = document.cookie.length;
						}
						return unescape(document.cookie.substring(c_start, c_end));
					}
				}
			});

			await browser.close();

			// ação 1
			login (tribunal, cookiesJfrn, 
				(page) => {
				searchProcess(page);
			});
		break;
	}
	
	
}


async function login ( tribunal, parameters, callback ) {
		
	let browser = await puppeteer.launch({headless: false});
	
	let page = await browser.newPage();
	
	let cookies = [];
	
	switch( tribunal ){
		case "tjrn": 
		cookies = [
			{
				name: "ROUTER_ID",
				value: parameters.ROUTER_ID,
				domain: "pje1g.tjrn.jus.br",
				path: "/",
				expire: "Session",
				secure: true
			},
			{
				name: "JSESSIONID",
				value: parameters.JSESSIONID,
				domain: "pje1g.tjrn.jus.br",
				path: "/pje",
				expire: "Session"
			}
		];
		url = "https://pje1g.tjrn.jus.br/pje/Processo/ConsultaProcesso/listView.seam";
		break;
		
		case "jfrn": 
		cookies = [
			{
				name: "JSESSIONID",
				value: parameters,
				domain: "pje.jfrn.jus.br",
				path: "/pje",
				expire: "Session",
				secure: true
			}
		];
		url = "https://pje.jfrn.jus.br/pje/Processo/ConsultaProcesso/listView.seam";
		break;
		
	}
	
	await page.setCookie(...cookies);
	
	await page.goto(url);
	
	callback(page);
}


function searchProcess ( page ) {
	const processNumber = readlineSync.question('Qual nº do processo? ');
	page.mainFrame()
	.waitForSelector('[name="fPP:numeroProcesso:numeroSequencial"]')
	.then(() => {
		page.type('[name="fPP:numeroProcesso:numeroSequencial"]', processNumber, {delay: 100});
	});
}


function getCookie(c_name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1) {
				c_end = document.cookie.length;
			}
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return "";
}

start();

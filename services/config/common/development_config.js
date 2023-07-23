const dbName = 'cryptoExchange';
const dbUser = "commonuser";
const dbPwd = "FkQ2tjE0sMqq0nVV";
const dbCluster = "cluster0.nwfdn.mongodb.net";

let envname = process.env.NODE_ENV;

module.exports = {
	env: envname,
	dbName: dbName,
	dbconnection: `mongodb+srv://${dbUser}:${dbPwd}@${dbCluster}/${dbName}?retryWrites=true&w=majority`,
	caPath: "",
	port: 3009,
	passPhrase: 'T1Bt0Lx5jPu5L6AJ8523IAv0anRd03Ya',
	algorithm: 'aes-256-ctr',
	iv: 'bLMjTTIuNUpWe345',
	jwtTokenAdmin: 'ExAdMin',
	jwtTokenCustomers: 'userExPan',
	smtpDetails: {
		keys: {
			host: 'smtppro.zoho.in',
			port: 465,
			secure: true,
			auth: {
				user: 'do-not-reply@fibitpro.com',
				pass: 'Donotreply@133471'
			}
		},
		email: 'do-not-reply@fibitpro.com'
	},
	serverType: 'http',
	options: {
		// 
	},
	adminEnd: 'https://fibitexchange-backoffice.fibitpro.com/',
	frontEnd: 'https://fibitexchange.fibitpro.com/',
	backEnd: "https://fibitexchange-api-new.fibitpro.com/api/",
	galleryLink: "https://fibitexchange-api-new.fibitpro.com/",
	siteName: 'cryptoExchange',
	url: "localhost",

	timer: {
        resendOtp: 120
    },

	FanTknSymbol: "FBT",

	sectionStatus: {
		spotTrade: "Enable",
		perpetualTrade: "Enable",
		p2p: "Enable",
		captcha: "Enable",
		cryptoLoan: "Enable",
		spotTradeCron: "Enable",
		derivativeCron: "Enable",
		pushNotification: "Enable",
		activityNotification: "Disable"
	},
	socketUrl: {
		socket_url: 'https://fibitexchange-api-new.fibitpro.com/',
	}
}
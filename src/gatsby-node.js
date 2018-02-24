const fetch = require('fetch-retry')
const crypto = require('crypto')
const xml2js = require('xml2js')
const sequence = require('promise-sequence')

async function fetchSchema(options) {
	let data = await fetch(options.taxonomyUrl, {
		method: 'GET',
		headers: options.headers,
	})
	console.log(`Fetched Deere taxonomy...`)
	data = await data.text()
	data = await parseString(data)
	return data
}

function parseString(str) {
	return new Promise((resolve, reject) => {
		xml2js.parseString(str, (err, res) => {
			if (err) return reject(err)
			resolve(res)
		})
	})
}

function getProduct(data, arr = []) {
	for (let i in data) {
		if (typeof data[i] === 'object') {
			if (Array.isArray(data[i]) && data[i][0].sku && data[i][0].path) {
				if (data[i][0].sku[0] && data[i][0].path[0]) {
					arr.push(data[i][0].path[0])
				}
			}
			else {
				getProduct(data[i], arr)
			}
		}
	}
	return arr
}

function getUrls(data, arr = []) {
	for (let i in data) {
		if (i === 'path' && data[i].length) {
			arr.push(data[i][0])
		}
		else if (typeof data[i] === 'object') {
			getUrls(data[i], arr)
		}
	}
	return arr
}

function removeNull(obj) {
	for (let i in obj) {
		if (obj[i] == null) {
			delete obj[i]
		}
		else if (typeof obj[i] === 'object') {
			obj[i] = removeNull(obj[i])
		}
	}
	return obj
}

async function fetchData(url, options) {
	let data
	try {
		data = await fetch(options.prepend + url + options.append, {
			method: 'GET',
			headers: options.headers,
		})
	}
	catch (err) {
		console.log(`Error fetching Deere data ${url}`)
		//console.error(err)
		return
	}
	if (data) {
		try {
			data = await data.json()
		}
		catch (err) {
			console.log(`Error parsing Deere JSON ${url}`)
			//console.error(err)
			return
		}
	}
	console.log('Succeeded fetching Deere JSON')
	if (options.mutate) {
		data = options.mutate(data)
	}

	// TESTING!
	data = removeNull(data)
	delete data.Page['table']



	//console.log(JSON.stringify(data, null, 3))
	return Object.assign({
		id: url,
		parent: null,
		children: [],
		internal: {
			type: options.internalType,
			contentDigest: crypto
				.createHash('md5')
				.update(JSON.stringify(data))
				.digest('hex'),
			mediaType: 'application/json',
		}
	}, data)
}

exports.sourceNodes = async ({ boundActionCreators }, options) => {

	options = Object.assign({
		urls: [],
		prepend: 'https://www.deere.com',
		append: 'index.json',
		headers: {},
		internalType: 'ApiContent',
		productOnly: true,
		taxonomyUrl: `https://www.deere.com/en/us-en.taxonomy`,
	}, options)

	const { createNode } = boundActionCreators

	console.log('Fetching Deere taxonomy...')
	const taxonomy = await fetchSchema(options)
	let urls
	if (options.productOnly) {
		urls = getProduct(taxonomy)
	}
	else {
		urls = getUrls(taxonomy)
	}
	console.log(`Found ${urls.length} Deere URLs...`)
	//urls.length = 203

	/*
	urls = [
		urls[201],
		urls[202],
	]
	*/

	const promises = urls.map(url => {
		return fetchData(url, options)
	})
	console.log(`Fetching ${urls.length} Deere URLs...`)
	let data = await sequence(promises)

	console.log(`Creating Deere nodes...`)
	data.forEach((datum, key) => {
		if (typeof datum === 'object') {
			createNode(datum)
		}
	})

	console.log(`Created Deere nodes.`)

	return
}

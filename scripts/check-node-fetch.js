const id = process.argv[2] || 'ibQ0dwjRNh'
const apiKey = 'FAK_TEST_6dea81bbb5e8347c3e34'
const apiUser = 'ad395e23-2fb4-4091-b207-615b34accf4d'
const url = `https://sandbox.fapshi.com/payment-status/${id}`

console.log(`🚀 Testing Node.js fetch for: ${url}`)

async function main() {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiuser': apiUser,
                'apikey': apiKey
            }
        })

        console.log(`Status: ${response.status} ${response.statusText}`)
        if (response.ok) {
            const data = await response.json()
            console.log('✅ Success!')
            console.log(JSON.stringify(data, null, 2))
        } else {
            const text = await response.text()
            console.log(`❌ Error: ${text}`)
        }
    } catch (error) {
        console.error('❌ Fetch Failed:')
        console.error(error)
        if (error.cause) {
            console.error('Cause:', error.cause)
        }
    }
}

main()

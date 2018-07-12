const {pg, Pool} = require('pg')

module.exports = { 
  query: pgQuery,
  insert: pgInsert
}

if (process.env.DATABASE_URL) pg.defaults.ssl = true

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/medtrack'

const pool = new Pool({
  connectionString: connectionString,
})

async function pgQuery(query){
  let resp = await pool.query(query)
  return resp.rows
}

async function pgInsert(query){ //..query is an object
  return (async () => {
    // note: we don't try/catch this because if connecting throws an exception
    // we don't need to dispose of the client (it will be undefined)
    // const client = await pool.connect()

    try {
      await pool.query('BEGIN')
      for(i = 0; i<query.values.length; ++i){
        await pool.query(query.text, query.values[i]) //..multiple inserts wrapped in a transaction
      }
      await pool.query('COMMIT')
      return { status: 'Completed Successfully' } //..to display to screen 
    } catch (e) {
      await pool.query('ROLLBACK')
      return e //..to display to screen 
      // throw e //..for internal debugging
    } finally {
      pool.end()
    }
  })().catch(e => console.error(e.stack))
}

// async function pgCreateAccountsTable() {
//   //..important transaction syntax
//   (async () => {
//     // note: we don't try/catch this because if connecting throws an exception
//     // we don't need to dispose of the client (it will be undefined)
//     const client = await pool.connect()
  
//     try {
//       await client.query('BEGIN')
//       const query = {
//         text: 'create table accounts (id varchar(40) NOT NULL PRIMARY KEY, name varchar(60) NOT NULL)'
//       }
//       await client.query(query)
//       await client.query('COMMIT')
//     } catch (e) {
//       await client.query('ROLLBACK')
//       throw e
//     } finally {
//       client.release()
//     }
//   })().catch(e => console.error(e.stack))
// }

// // // async/await
// // try {
// //   const res = await pool.query(text, values)
// //   console.log(res.rows[0])
// //   // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
// // } catch(err) {
// //   console.log(err.stack)
// // }
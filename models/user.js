/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(
      `INSERT INTO users
      (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING  username, password, first_name, last_name, phone
      `,
      [username, hashedPW, first_name, last_name, phone]
    )
      return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password FROM users 
      WHERE username = $1
      `,
      [username]
    )
    const user = result.rows[0] // this value will be truthy if the "result" returns the user 

    if(user){ // if there is a user with the passed in username
      if(await bcrypt.compare(password, user.password) === true ) // and if the password is matches the passed in pw and the hashed pw (from our users obj coming from db)
        return true // then we return true for this function 
    }

    else throw new ExpressError("Invalid user/password", 400)

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username`,
      [username]);

  if (!result.rows[0]) {
    throw new ExpressError(`No such message: ${username}`, 404);
  }

  return result.rows[0];

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    
    const results = await db.query(
      `SELECT username, 
         first_name,  
         last_name, 
         phone
       FROM users
       ORDER BY username`
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 

    const result = await db.query(
      `SELECT username, 
        first_name, 
        last_name, 
        phone, 
        join_at, 
        last_login_at
      FROM users 
      WHERE username =$1
      `,
      [username]
    )
    
    const user = result.rows[0];

    if (!user) {
      throw new ExpressError(`No such message: ${username}`, 404);
    }

    return user;


  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await db.query(`
        SELECT id, 
              from_username, 
              body, 
              sent_at, 
              read_at, 
              username, 
              first_name, 
              last_name, 
              phone
        FROM messages 
        LEFT JOIN users 
        ON messages.to_username = users.username
        WHERE from_username = $1 
        `,
        [username])

      // let users = result.rows[0]

      // if(!users){
      //   throw new ExpressError(`No such message: ${username}`, 404);
      // }

      return result.rows.map(m => ({
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body, 
        sent_at: m.sent_at, 
        read_at: m.read_at
      })) 
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(`
        SELECT id, 
              from_username, 
              body, 
              sent_at, 
              read_at, 
              username, 
              first_name, 
              last_name, 
              phone
        FROM messages 
        LEFT JOIN users 
        ON messages.from_username = users.username
        WHERE to_username = $1 
        `,
        [username])

      return result.rows.map(m => ({
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body, 
        sent_at: m.sent_at, 
        read_at: m.read_at
      })) 

  }
}


module.exports = User;
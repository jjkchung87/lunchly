/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes, totalReservations }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this._fullName = firstName+" "+lastName;
    this.phone = phone;
    this.notes = notes;
    this.totalReservations = totalReservations;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async getBySearch(query){
    const fullName = query.split(" ")
    let firstName;
    let lastName;

       
    if(fullName.length === 2) {
      firstName = fullName[0]
      lastName = fullName[1]
    }

    if(fullName.length === 1){
      firstName = fullName[0]
      lastName = fullName[0]
    }
    
    const results = await db.query(
      `SELECT id,
        first_name AS "firstName",
        last_name AS "lastName",
        phone,
        notes
      FROM customers
      WHERE first_name ILIKE $1 OR last_name ILIKE $2`, [`%${firstName}%`, `%${lastName}%`]
    );
    return results.rows.map(c => new Customer(c));
  }

  static async getTop10(){
    const results = await db.query(
      `SELECT c.id,
        first_name AS "firstName",
        last_name AS "lastName",
        phone,
        c.notes,
        COUNT(r.id) AS "totalReservations"
      FROM customers c
      JOIN reservations r
      ON c.id = r.customer_id
      GROUP BY c.id, first_name, last_name, phone, c.notes
      ORDER BY COUNT(r.id) DESC
      LIMIT 10
      `)
    return results.rows.map(c => new Customer(c))
  }



  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }


  get fullName(){
    return this._fullName;
  }



}

module.exports = Customer;

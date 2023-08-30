/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this._customerId = customerId;
    this._numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }


  set numGuests(value){
    if(value < 1){
      const err = new Error("At least one guest required");
      throw err;
    }

    this._numGuests = value;
  }

  get numGuests(){
    return this._numGuests;
  }

  set customerId(value){
    if(this._customerId){
      const err = new Error("customer ID cannot be changed")
      throw err;
    }
    this._customerId = value;
  }

  get customerId(){
    return this._customerId;
  }

  /** given a customer id, find their reservations. */

  static async getReservation(id){
    const results = await db.query(
      `SELECT id, 
        customer_id AS "customerId", 
        num_guests AS "numGuests", 
        start_at AS "startAt", 
        notes AS "notes"
      FROM reservations 
      WHERE id = $1`,
      [id]
    )

    return new Reservation(results.rows[0]);
  }

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  async save () {
    if(this.id === undefined) {
      let results = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, customer_id, num_guests, start_at, notes
        `,[this.customerId, this.numGuests, this.startAt, this.notes]);
      this.id = results.rows[0].id;
    } else {
        let results = await db.query(
        `UPDATE reservations SET num_guests = $1, start_at = $2, notes=$3
        WHERE id = $4
        RETURNING id, customer_id, num_guests, start_at, notes
        `,[this.numGuests, this.startAt, this.notes, this.id]);
    }
    
  };

}



module.exports = Reservation;


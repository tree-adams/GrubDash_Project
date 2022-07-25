const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function hasDeliverTo (req, res, next) {
    const {data: {deliverTo} = {}} = req.body
    if (!deliverTo || deliverTo === "") {
        next({
            status: 400, 
            message: `Order must include a deliverTo`
        })
    }
    next()
}; 

function hasMobileNumber (req, res, next) {
    const {data: {mobileNumber} = {}} = req.body
    if (!mobileNumber || mobileNumber === "") {
        next({
            status: 400, 
            message: `Order must include a mobileNumber`
        })
    }
    next()
}; 

function hasDishes (req, res, next) {
    const {data: {dishes} = {}} = req.body 
    if (!dishes) {
        next({
            status: 400, 
            message: `Order must include a dish`
        })
    }
    if (dishes.length === 0 || !Array.isArray(dishes)) {
        next({
            status: 400, 
            message: `Order must include at least one dish`
        })
    }
    next()
};

function hasQuantity(req, res, next) {
    const {data: {dishes} = {}} = req.body 
    for (let index = 0; index < dishes.length; index++) {
        if (!dishes[index].quantity) {
            next({
                status: 400, 
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })
        }
        if (dishes[index].quantity <= 0 || !Number.isInteger(dishes[index].quantity)) {
            return next({
                status: 400, 
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })
        }
    }
    next()
}; 

function orderExists(req, res, next) {
    const {orderId} = req.params 
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        return next() 
    } 
    next({
        status: 404, 
        message: `Order does not exist: ${orderId}`
    })
}

function theStatus (req, res, next) {
    const {data: {status} = {}} = req.body
    if (!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) {
        next({
            status: 400, 
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        })
    } else if (status === "delivered") {
        next({
            status: 400, 
            message: `A delivered order cannnot be changed`
        })
    }
    next()
}; 

function willDelete(req, res, next) {
    const order = res.locals.order 
    if (order.status === "pending") {
        return next()
    }
    next({
        status: 400, 
        message: `An order cannot be deleted unless it is pending`
    })
}; 

function list (req, res, next) {
    res.json({data: orders})
}; 

function create(req, res, next) {
    const {data: {deliverTo, mobileNumber, dishes, status} = {}} = req.body
    const newOrder = {
        id: nextId(), 
        deliverTo, 
        mobileNumber, 
        dishes, 
        status: status ? status : "pending", 
    }
    orders.push(newOrder)
    res.status(201).json({data: newOrder})
}; 

function update(req, res, next) {
    const {order} = res.locals
    const {orderId} = req.params
    const {data: {id, deliverTo, mobileNumber, dishes, status} = {}} = req.body
    if (!id || orderId === id) {
        const updatedOrder = {
        id: orderId,
        deliverTo,
        mobileNumber,
        dishes,
        status,
        }
        res.json({data: updatedOrder})
    }
    next({
        status: 400, 
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    })
}; 

function read(req, res, next) {
    res.json({data: res.locals.order})
}; 

function destroy(req, res, next) {
    const {orderId} = req.params
    const index = orders.findIndex((order) => order.id === orderId)
    const removedOrder = orders.splice(index, 1)
    res.sendStatus(204)
}; 

module.exports = {
    list, 
    create: [
        hasDeliverTo, 
        hasMobileNumber,
        hasDishes,
        hasQuantity,
        create,
    ],
    read: [
        orderExists, 
        read,
    ], 
    update: [
        orderExists,
        hasDeliverTo,
        hasMobileNumber,
        hasDishes,
        hasQuantity,
        theStatus,
        update,
    ], 
    delete: [
        orderExists,
        willDelete,
        destroy,
    ],
}; 
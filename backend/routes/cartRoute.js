import express from 'express'
import { addToCart, getUserCart, updateCart } from '../controllers/cartController.js'
import { auth } from '../middleware/auth.js'

const cartRouter = express.Router()

cartRouter.post('/get', auth, getUserCart)
cartRouter.post('/add', auth, addToCart)
cartRouter.post('/update', auth, updateCart)

export default cartRouter
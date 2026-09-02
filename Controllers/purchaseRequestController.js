const PurchaseRequest =
    require("../Models/PurchaseRequest");


/*
 * Create manual Purchase Request
 */
const createPurchaseRequest =
    async (req, res) => {

        try {

            const {
                requestNumber,
                warehouse,
                items,
                remarks
            } = req.body;

            if (
                !requestNumber ||
                !warehouse ||
                !items ||
                items.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Request number, warehouse and items are required"
                });
            }

            const existing =
                await PurchaseRequest.findOne({
                    requestNumber
                });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Request number already exists"
                });
            }

            const request =
                await PurchaseRequest.create({
                    requestNumber,
                    warehouse,
                    items,
                    reason: "MANUAL",
                    status: "PENDING",
                    remarks
                });

            res.status(201).json({
                success: true,
                message:
                    "Purchase request created successfully",
                data: request
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


/*
 * Get all Purchase Requests
 */
const getPurchaseRequests =
    async (req, res) => {

        try {

            const requests =
                await PurchaseRequest.find()
                    .populate("warehouse")
                    .populate("items.product")
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                success: true,
                count: requests.length,
                data: requests
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


/*
 * Get one Purchase Request
 */
const getPurchaseRequestById =
    async (req, res) => {

        try {

            const request =
                await PurchaseRequest.findById(
                    req.params.id
                )
                    .populate("warehouse")
                    .populate("items.product");

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase request not found"
                });
            }

            res.status(200).json({
                success: true,
                data: request
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


/*
 * Approve Purchase Request
 */
const approvePurchaseRequest =
    async (req, res) => {

        try {

            const request =
                await PurchaseRequest.findById(
                    req.params.id
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase request not found"
                });
            }

            if (
                request.status !== "PENDING"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Only pending requests can be approved"
                });
            }

            request.status = "APPROVED";

            await request.save();

            res.status(200).json({
                success: true,
                message:
                    "Purchase request approved",
                data: request
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


/*
 * Reject Purchase Request
 */
const rejectPurchaseRequest =
    async (req, res) => {

        try {

            const request =
                await PurchaseRequest.findById(
                    req.params.id
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Purchase request not found"
                });
            }

            if (
                request.status !== "PENDING"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Only pending requests can be rejected"
                });
            }

            request.status = "REJECTED";

            await request.save();

            res.status(200).json({
                success: true,
                message:
                    "Purchase request rejected",
                data: request
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


module.exports = {
    createPurchaseRequest,
    getPurchaseRequests,
    getPurchaseRequestById,
    approvePurchaseRequest,
    rejectPurchaseRequest
};
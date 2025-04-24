/* global Vue axios */ //> from vue.html
const $ = sel => document.querySelector(sel)
const GET = (url) => axios.get('/sales'+url)
const POST = (cmd, data) => axios.post('/sales'+cmd, data)

const salesApp = Vue.createApp({
    data() {
        return {
            list: [],
            plan: undefined,
            editMode: false,
            createMode: false,
            formData: null,
            message: { success: '', error: '' },
            user: undefined,
            
            // 商品相关状态
            activeTab: 'plans', // 当前激活的标签页：plans | products
            productList: [], // 商品列表
            product: undefined, // 当前显示的商品
            productEditMode: false, // 商品编辑模式
            productCreateMode: false, // 商品创建模式
            productFormData: null, // 商品表单数据
            
            // 销售计划商品关联
            planItems: [], // 计划关联的商品列表
            itemDialogOpen: false, // 添加商品对话框状态
            selectedProductId: null, // 选中的商品ID
            itemFormData: { // 添加商品表单数据
                quantity: 1,
                targetPrice: 0,
                discount: 0,
                notes: ''
            }
        }
    },

    methods: {
        // 搜索功能
        search: ({target:{value:v}}) => {
            if (salesApp.activeTab === 'plans') {
                salesApp.fetch(v && '&$search='+v)
            } else {
                salesApp.fetchProducts(v && '&$search='+v)
            }
        },

        // 获取列表数据
        async fetch(etc='') {
            try {
                const {data} = await GET(`/ListOfSalesPlans?$orderby=startDate desc${etc}`)
                salesApp.list = data.value
            } catch (error) {
                console.error('获取数据失败:', error)
                salesApp.message = { error: '获取数据失败，请稍后再试' }
            }
        },

        // 查看详情
        async inspect(eve) {
            const planId = eve.currentTarget.id
            try {
                const res = await GET(`/SalesPlans/${planId}`)
                salesApp.plan = res.data
                salesApp.message = { success: '', error: '' }
                
                // 获取计划关联的商品
                await salesApp.fetchPlanItems(planId)
            } catch (error) {
                console.error('获取详情失败:', error)
                salesApp.message = { error: '获取详情失败，请稍后再试' }
            }
        },

        // 返回列表
        back() {
            salesApp.plan = undefined
            salesApp.editMode = false
            salesApp.createMode = false
            salesApp.formData = null
            salesApp.message = { success: '', error: '' }
            
            salesApp.product = undefined
            salesApp.productEditMode = false
            salesApp.productCreateMode = false
            salesApp.productFormData = null
            salesApp.planItems = []
            salesApp.closeItemDialog()
        },

        // 开始编辑
        startEdit() {
            salesApp.editMode = true
            salesApp.formData = { ...salesApp.plan }
            
            // 日期格式转换为YYYY-MM-DD，用于日期输入框
            if (salesApp.formData.startDate) {
                salesApp.formData.startDate = this.formatDateForInput(salesApp.formData.startDate)
            }
            if (salesApp.formData.endDate) {
                salesApp.formData.endDate = this.formatDateForInput(salesApp.formData.endDate)
            }
        },

        // 开始创建
        startCreate() {
            salesApp.createMode = true
            salesApp.formData = {
                title: '',
                description: '',
                startDate: this.formatDateForInput(new Date()),
                endDate: this.formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 1))),
                targetAmount: 0,
                unit: '件',
                status: 'draft',
                responsiblePerson: '',
                remarks: ''
            }
        },

        // 保存计划
        async savePlan() {
            try {
                let response
                
                if (salesApp.createMode) {
                    // 创建新计划
                    response = await axios.post('/sales/SalesPlans', salesApp.formData)
                    salesApp.message = { success: '创建成功！', error: '' }
                } else {
                    // 更新计划
                    response = await axios.patch(`/sales/SalesPlans/${salesApp.formData.ID}`, salesApp.formData)
                    salesApp.message = { success: '更新成功！', error: '' }
                }
                
                // 更新当前plan显示
                salesApp.plan = response.data
                salesApp.editMode = false
                salesApp.createMode = false
                salesApp.formData = null
                
                // 刷新列表
                salesApp.fetch()
                
                // 获取计划关联的商品
                if (salesApp.plan && salesApp.plan.ID) {
                    await salesApp.fetchPlanItems(salesApp.plan.ID)
                }
            } catch (error) {
                console.error('保存失败:', error)
                salesApp.message = { error: `保存失败: ${error.response?.data?.error?.message || '请稍后再试'}` }
            }
        },

        // 完成计划
        async completePlan() {
            try {
                const response = await POST('/completeSalesPlan', { salesPlan: salesApp.plan.ID })
                salesApp.plan = response.data
                salesApp.message = { success: '计划已标记为完成！', error: '' }
                salesApp.fetch() // 刷新列表
            } catch (error) {
                console.error('操作失败:', error)
                salesApp.message = { error: `操作失败: ${error.response?.data?.error?.message || '请稍后再试'}` }
            }
        },

        // 取消计划
        async cancelPlan() {
            try {
                const response = await POST('/cancelSalesPlan', { salesPlan: salesApp.plan.ID })
                salesApp.plan = response.data
                salesApp.message = { success: '计划已取消！', error: '' }
                salesApp.fetch() // 刷新列表
            } catch (error) {
                console.error('操作失败:', error)
                salesApp.message = { error: `操作失败: ${error.response?.data?.error?.message || '请稍后再试'}` }
            }
        },

        // 格式化日期显示
        formatDate(dateString) {
            if (!dateString) return ''
            const date = new Date(dateString)
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
        },

        // 格式化日期为表单输入格式 (YYYY-MM-DD)
        formatDateForInput(date) {
            if (!date) return ''
            const d = new Date(date)
            return d.toISOString().split('T')[0]
        },

        // 获取状态文字
        getStatusText(status) {
            const statusMap = {
                'draft': '草稿',
                'inProgress': '进行中',
                'completed': '已完成',
                'cancelled': '已取消'
            }
            return statusMap[status] || status
        },

        // 用户登录
        async login() {
            try {
                const { data:user } = await axios.post('/user/login',{})
                if (user.id !== 'anonymous') salesApp.user = user
            } catch (err) { salesApp.user = { id: err.message } }
        },

        // 获取用户信息
        async getUserInfo() {
            try {
                const { data:user } = await axios.get('/user/me')
                if (user.id !== 'anonymous') salesApp.user = user
            } catch (err) { salesApp.user = { id: err.message } }
        },
        
        // 切换标签页
        switchTab(tab) {
            salesApp.activeTab = tab
            salesApp.back() // 清除当前显示的内容，返回列表视图
            
            if (tab === 'plans') {
                salesApp.fetch()
            } else {
                salesApp.fetchProducts()
            }
        },
        
        // 获取商品列表
        async fetchProducts(etc='') {
            try {
                const {data} = await GET(`/Products?$orderby=ID${etc}`)
                salesApp.productList = data.value
            } catch (error) {
                console.error('获取商品数据失败:', error)
                salesApp.message = { error: '获取商品数据失败，请稍后再试' }
            }
        },
        
        // 查看商品详情
        async inspectProduct(eve) {
            const productId = eve.currentTarget.id
            try {
                const res = await GET(`/Products/${productId}`)
                salesApp.product = res.data
                salesApp.message = { success: '', error: '' }
            } catch (error) {
                console.error('获取商品详情失败:', error)
                salesApp.message = { error: '获取商品详情失败，请稍后再试' }
            }
        },
        
        // 开始编辑商品
        startEditProduct() {
            salesApp.productEditMode = true
            salesApp.productFormData = { ...salesApp.product }
        },
        
        // 开始创建商品
        startCreateProduct() {
            salesApp.productCreateMode = true
            salesApp.productFormData = {
                name: '',
                description: '',
                price: 0,
                currency_code: 'CNY',
                category: '',
                sku: '',
                stock: 0,
                unit: '个',
                imageUrl: ''
            }
        },
        
        // 保存商品
        async saveProduct() {
            try {
                let response
                
                if (salesApp.productCreateMode) {
                    // 创建新商品
                    response = await axios.post('/sales/Products', salesApp.productFormData)
                    salesApp.message = { success: '商品创建成功！', error: '' }
                } else {
                    // 更新商品
                    response = await axios.patch(`/sales/Products/${salesApp.productFormData.ID}`, salesApp.productFormData)
                    salesApp.message = { success: '商品更新成功！', error: '' }
                }
                
                // 更新当前product显示
                salesApp.product = response.data
                salesApp.productEditMode = false
                salesApp.productCreateMode = false
                salesApp.productFormData = null
                
                // 刷新商品列表
                salesApp.fetchProducts()
            } catch (error) {
                console.error('保存商品失败:', error)
                salesApp.message = { error: `保存商品失败: ${error.response?.data?.error?.message || '请稍后再试'}` }
            }
        },
        
        // 获取销售计划关联的商品
        async fetchPlanItems(planId) {
            try {
                const {data} = await GET(`/SalesPlans/${planId}/items?$expand=product`)
                salesApp.planItems = data.value
            } catch (error) {
                console.error('获取计划商品失败:', error)
                salesApp.message = { error: '获取计划商品失败，请稍后再试' }
            }
        },
        
        // 打开添加商品对话框
        openItemDialog() {
            salesApp.itemDialogOpen = true
            salesApp.itemFormData = {
                quantity: 1,
                targetPrice: 0,
                discount: 0,
                notes: ''
            }
            salesApp.selectedProductId = null
            
            // 获取所有商品列表供选择
            salesApp.fetchProducts()
        },
        
        // 关闭添加商品对话框
        closeItemDialog() {
            salesApp.itemDialogOpen = false
            salesApp.itemFormData = {
                quantity: 1,
                targetPrice: 0,
                discount: 0,
                notes: ''
            }
            salesApp.selectedProductId = null
        },
        
        // 添加商品到销售计划
        async addProductToPlan() {
            if (!salesApp.selectedProductId || !salesApp.plan) {
                salesApp.message = { error: '请选择商品' }
                return
            }
            
            try {
                // 检查是否已经添加过该商品
                const existingItem = salesApp.planItems.find(item => item.product.ID == salesApp.selectedProductId)
                if (existingItem) {
                    salesApp.message = { error: '该商品已添加到计划中' }
                    return
                }
                
                // 获取选择的商品详情，用于设置默认价格
                const productRes = await GET(`/Products/${salesApp.selectedProductId}`)
                const product = productRes.data
                
                // 设置默认价格
                if (product && product.price) {
                    salesApp.itemFormData.targetPrice = product.price
                }
                
                // 构建添加商品的请求数据
                const itemData = {
                    salesPlan_ID: salesApp.plan.ID,
                    product_ID: parseInt(salesApp.selectedProductId),
                    ...salesApp.itemFormData
                }
                
                // 发送请求添加商品
                await axios.post('/sales/SalesPlanItems', itemData)
                
                // 成功后刷新计划商品列表
                await salesApp.fetchPlanItems(salesApp.plan.ID)
                salesApp.message = { success: '商品添加成功！', error: '' }
                
                // 关闭对话框
                salesApp.closeItemDialog()
            } catch (error) {
                console.error('添加商品失败:', error)
                salesApp.message = { error: `添加商品失败: ${error.response?.data?.error?.message || '请稍后再试'}` }
            }
        },
        
        // 从销售计划中移除商品
        async removeProductFromPlan(itemId) {
            if (!confirm('确定要从销售计划中移除此商品吗？')) {
                return
            }
            
            try {
                // 发送请求删除商品关联
                await axios.delete(`/sales/SalesPlanItems/${itemId}`)
                
                // 成功后刷新计划商品列表
                await salesApp.fetchPlanItems(salesApp.plan.ID)
                salesApp.message = { success: '商品已移除！', error: '' }
            } catch (error) {
                console.error('移除商品失败:', error)
                salesApp.message = { error: `移除商品失败: ${error.response?.data?.error?.message || '请稍后再试'}` }
            }
        },
        
        // 选择商品时更新价格
        async updatePriceFromProduct() {
            if (!salesApp.selectedProductId) return
            
            try {
                const productRes = await GET(`/Products/${salesApp.selectedProductId}`)
                const product = productRes.data
                
                if (product && product.price) {
                    salesApp.itemFormData.targetPrice = product.price
                }
            } catch (error) {
                console.error('获取商品价格失败:', error)
            }
        },
        
        // 计算折扣后的价格
        getDiscountedPrice(price, discount) {
            if (!price || !discount) return price
            return (price * (100 - discount) / 100).toFixed(2)
        },
        
        // 格式化货币金额显示
        formatCurrency(amount, currency = 'CNY') {
            if (amount === undefined || amount === null) return ''
            
            // 根据不同货币使用不同格式
            const currencyFormats = {
                'CNY': { style: 'currency', currency: 'CNY', currencyDisplay: 'symbol' },
                'USD': { style: 'currency', currency: 'USD', currencyDisplay: 'symbol' },
                'EUR': { style: 'currency', currency: 'EUR', currencyDisplay: 'symbol' }
            }
            
            const format = currencyFormats[currency] || currencyFormats['CNY']
            return new Intl.NumberFormat('zh-CN', format).format(amount)
        }
    }
}).mount('#app')

// 自动加载用户信息
salesApp.getUserInfo()
// 初始加载销售计划列表
salesApp.fetch()

// CSRF令牌处理
axios.interceptors.request.use(csrfToken)
function csrfToken(request) {
    if (request.method === 'head' || request.method === 'get') return request
    if ('csrfToken' in document) {
        request.headers['x-csrf-token'] = document.csrfToken
        return request
    }
    return fetchToken().then(token => {
        document.csrfToken = token
        request.headers['x-csrf-token'] = document.csrfToken
        return request
    }).catch(() => {
        document.csrfToken = null // 设置标记，不再尝试
        return request
    })

    function fetchToken() {
        return axios.get('/', { headers: { 'x-csrf-token': 'fetch' } })
        .then(res => res.headers['x-csrf-token'])
    }
} 
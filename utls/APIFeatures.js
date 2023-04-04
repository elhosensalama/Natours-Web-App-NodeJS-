class APIFeatures {
    constructor(mongooseQuery, requestQueryString) {
        this.mongooseQuery = mongooseQuery;
        this.requestQueryString = requestQueryString;
    }

    filter() {
        const queryObj = { ...this.requestQueryString };
        const excludedFields = ['page', 'limit', 'sort', 'fields'];
        excludedFields.forEach(element => {
            delete queryObj[element];
        });
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
        this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryString));
        return this;
    }

    sort() {
        if (this.requestQueryString.sort) {
            const sortBy = this.requestQueryString.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else {
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        // 3) Field Limiting
        if (this.requestQueryString.fields) {
            const fields = this.requestQueryString.fields.split(',').join(' ');
            // query = query.select('name price');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }
        return this;
    }

    async paginate() {
        const page = +this.requestQueryString.page || 1;
        const limit = +this.requestQueryString.limit || 100;
        const skip = (page - 1) * limit;
        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    }
}

module.exports = APIFeatures;

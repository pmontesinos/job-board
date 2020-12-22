const db = require('./db');

const Query = {
  company: (root, {id}) => db.companies.get(id),
  // since we're at parent, we're calling parent object root
  // args is what is passed in
  job: (root, args) => db.jobs.get(args.id),
  jobs: () => db.jobs.list()
};

const Company = {
  jobs: (company) => db.jobs.list()
    .filter((job) => job.companyId === company.id)
};

// first param (in company) is parent object
const Job = {
  company: (job) => db.companies.get(job.companyId)
}

module.exports = { Query, Job, Company };

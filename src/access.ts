const access = {
    staff: {
        create: false,
        read: false,
        update: false,
        delete: false,
    },
    order: {
        create: true,
        read: true,
        update: true,
        delete: false,
    },
    customer: {
        create: true,
        read: true,
        update: false,
        delete: false,
    },
};

export { access };

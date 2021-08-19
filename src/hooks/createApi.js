import Urbit from "@urbit/http-api";
import { memoize } from "lodash";

const createApi = memoize(async () => {
    const urb = new Urbit(
        'http://localhost:80', 
        'lidlut-tabwed-pillex-ridrup' 
    );
    urb.ship = "zod";
    return urb;    
});

export default createApi;
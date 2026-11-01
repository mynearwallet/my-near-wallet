import React from 'react';
import { Route } from 'react-router-dom';

import { isSunsetCapabilityEnabled } from '../../config/sunset';
import FeatureRetiredPage from './FeatureRetiredPage';

/**
 * A route that renders its usual guard while `capability` is available, and the retired page once
 * it is not. `<Switch>` matches on this element's own `path`/`exact`, so it drops in where the
 * guarded route was.
 *
 * `retireIf` narrows a route that only partly belongs to the capability: while it returns false
 * the guarded route still renders, even with the capability retired.
 *
 * Retired routes deliberately render a plain `<Route>`, not the original guard: a password or
 * sign-in guard would otherwise put an unlock or guest screen in front of the explanation.
 */
export default function SunsetGatedRoute({
    capability,
    guard: Guard = Route,
    retired,
    retireIf,
    ...routeProps
}) {
    if (isSunsetCapabilityEnabled(capability) || (retireIf && !retireIf())) {
        return <Guard {...routeProps} />;
    }

    return (
        <Route
            exact={routeProps.exact}
            path={routeProps.path}
            location={routeProps.location}
            computedMatch={routeProps.computedMatch}
            render={(props) =>
                retired ? (
                    retired(props)
                ) : (
                    <FeatureRetiredPage capability={capability} route={routeProps.path} />
                )
            }
        />
    );
}

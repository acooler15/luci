/* SPDX-License-Identifier: GPL-3.0-only
 *
 * Copyright (C) 2022 ImmortalWrt.org
 */

'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require view';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('zerotier'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['zerotier']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';
	var renderHTML;
	if (isRunning) {
		renderHTML = String.format(spanTemp, 'green', _('ZeroTier'), _('RUNNING'));
	} else {
		renderHTML = String.format(spanTemp, 'red', _('ZeroTier'), _('NOT RUNNING'));
	}

	return renderHTML;
}

return view.extend({

	render: function(data) {
    var m, s, o;

    m = new form.Map(
      "zerotier",
      _("ZeroTier"),
      _(
        "ZeroTier is an open source, cross-platform and easy to use virtual LAN."
      )
    );

    s = m.section(form.TypedSection);
    s.anonymous = true;
    s.render = function () {
      poll.add(function () {
        return L.resolveDefault(getServiceStatus()).then(function (res) {
          var view = document.getElementById("service_status");
          view.innerHTML = renderStatus(res);
        });
      });

      return E("div", { class: "cbi-section", id: "status_bar" }, [
        E("p", { id: "service_status" }, _("Collecting data ...")),
      ]);
    };

    s = m.section(form.NamedSection, "global", "zerotier");
    o = s.option(
      form.Flag,
      "enabled",
      _("Enable"),
      _("Sets whether ZeroTier is enabled or not")
    );
	o.rmempty = false;

    o = s.option(
      form.Value,
      "port",
      _("Listening Port"),
      _("Sets the ZeroTier listening port (default 9993; set to 0 for random)")
    );
	o.datatype = "port";
	o.default = "9993";

    o = s.option(
      form.Value,
      "secret",
      _("Client Secret"),
      _("Client secret (leave blank to generate a secret on first run)")
    );
	o.datatype = "string";
	o.rmempty = false;

    o = s.option(
      form.Value,
      "local_conf_path",
      _("Local Configuration Path"),
      _(
        "Path of the optional file local.conf (see documentation at https://docs.zerotier.com/config#local-configuration-options)"
      )
    );

    o = s.option(
      form.Value,
      "config_path",
      _("Persistent Configuration Path"),
      _(
        "Persistent configuration directory (to perform other configurations such as controller mode or moons, etc.)"
      )
    );

    // copy_config_path
    o = s.option(
      form.Flag,
      "copy_config_path",
      _("Copy Configuration Directory"),
      _(
        "Copy the contents of the persistent configuration directory to memory instead of linking it, this avoids writing to flash"
      )
    );

    // o = s.option(form.DynamicList, "join", _("Network ID"));
    // o.rmempty = false;

    // o = s.option(
    //   form.Flag,
    //   "nat",
    //   _("Auto NAT clients"),
    //   _("Allow ZeroTier clients access your LAN network.")
    // );
    // o.default = o.disabled;
    // o.rmempty = false;

    o = s.option(
      form.Button,
      "_panel",
      _("ZeroTier Central"),
      _(
        "Create or manage your ZeroTier network, and auth clients who could access."
      )
    );
    o.inputtitle = _("Open website");
    o.inputstyle = "apply";
    o.onclick = function () {
      window.open("https://my.zerotier.com/network", "_blank");
    };
    s = m.section(form.GridSection, "network", _("Networks"),_("Network configuration, you can have as many configurations as networks you want to join. see documentation at https://docs.zerotier.com/config/#network-specific-configuration"));
    s.anonymous = true;
    s.addremove = true;
    s.sortable = true;
	s.nodescriptions = true;
    s.addbtntitle = _("Add new Network...");
    o = s.option(form.Value, "id", _("ID"));
    o = s.option(
      form.Flag,
      "allow_managed",
      _("Allow Managed"),
      _(
        "Allow ZeroTier to set IP Addresses and Routes ( local/private ranges only). Default Yes."
      )
    );
	o.default = '1'
	
    // allow_global
    s.option(
      form.Flag,
      "allow_global",
      _("Allow Global"),
      _(
        "Allow ZeroTier to set Global/Public/Not-Private range IPs and Routes. Default No."
      )
    );
    // allow_default
    s.option(
      form.Flag,
      "allow_default",
      _("Allow Default"),
      _("Allow ZeroTier to set the Default Route on the system. Default No.")
    );
    // allow_dns
	s.option(
    form.Flag,
    "allow_dns",
    _("Allow DNS"),
    _("Allow ZeroTier to set DNS servers. Default No.")
  );
    return m.render();
  }
});

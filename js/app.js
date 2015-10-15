(function () {

'use strict';

var api_url = '//10.10.13.101:3000';

function page_status (is) {
    if (is === 202) {
        // pending
        $('#loader').removeClass('hide');
        $('#content').addClass('hide');
    }
    else if (is === 200) {
        // success
        $('#loader').addClass('hide');
        $('#content').removeClass('hide');
        $('#filler').addClass('hide');
    }
    else if (is === 301) {
        // fail
        Materialize.toast('Saving channel...', 4000) // 4000 is the duration of the toast
        $('#loader').addClass('hide');
        $('#content').addClass('hide');
    }
    else if (is === 404) {
        // fail
        Materialize.toast('Channel not found!', 4000) // 4000 is the duration of the toast
        $('#loader').addClass('hide');
        $('#content').addClass('hide');
    }
}

function save_channel (id) {
    if (id && typeof id === 'string') {
        $.ajax({
          url: api_url + '/index/' + id
        }).done(function(data) {
            console.log('save_channel',data);
            if (data.message === 'Done') {
                get_channel(id);
            }
            else {
                page_status(404);
            }
        }).fail(function(err) {
            page_status(404);
        });
    }
}

function get_channel (id) {
    if (id && typeof id === 'string') {
        page_status(202);
        $.ajax({
          url: api_url + '/channel/' + id
        }).done(function(data) {
            if (!data || !data.cms_changes || !data.spam_indicators || data.spam_indicators.message === 'Channel not on database') {
                save_channel(id);
                page_status(301);
            }
            else {
                process_indicators(data.spam_indicators);
                process_cmsChanges(data);
                page_status(200);
            }
        }).fail(function(err) {
            page_status(404);
        });
    }
}

function process_indicators (spam_indicators) {
    if (typeof spam_indicators !== "undefined") {
        var indicators_list_html = '',
            shared_average = (100/1500),
            indicators_collection = {
                no_earnings: {
                    formula: function (indicators) {
                        return shared_average * (indicators['earnings'] <= 0 ? 100 : 0);
                    },
                    title: 'No earnings',
                    exists: false
                },
                has_ccby: {
                    formula: function (indicators) {
                        return shared_average * (indicators['user_has_closed_channel'] ? 100 : 0);
                    },
                    title: 'Has channel closed by YouTube',
                    exists: false
                },
                inactive_channel: {
                    formula: function (indicators) {
                        return shared_average * (indicators['inactive'] ? 100 : 0);
                    },
                    title: 'Inactive channel',
                    exists: false
                },
                revenue_dropoff: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['earnings_last_30_days'] + 100) < (indicators['earnings_last_90_days'] / 3) ? 100 : 0);
                    },
                    title: 'Sudden revenue drop-off',
                    exists: false
                },
                no_banner_icon: {
                    formula: function (indicators) {
                        return shared_average * ((!!indicators['copied_channel'] ? 20 : 0) + (!!indicators['copied_videos'] ? indicators['copied_videos'] * .8 : 0));
                    },
                    title: 'No channel banner or icon',
                    exists: false
                },
                copycat_channel: {
                    formula: function (indicators) {
                        return shared_average * ((!!indicators['copied_channel'] ? 50 : 0) + (!!indicators['copied_videos'] ? 2 : 0));
                    },
                    title: 'Copycat channel',
                    exists: false
                },
                burst_uploads: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['burst_uploads'] || 0)/100);
                    },
                    title: 'Burst uploads',
                    exists: false
                },
                download_links: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['download_links'] || 0)/100);
                    },
                    title: 'Download links',
                    exists: false
                },
                copied_videos: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['copied_videos'] || 0)/100);
                    },
                    title: 'Copied videos',
                    exists: false
                },
                full_episodes: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['full_episodes'] || 0)/100);
                    },
                    title: 'Full episodes',
                    exists: false
                },
                legal_phrases: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['legal_phrases'] || 0)/100);
                    },
                    title: 'Legal phrases',
                    exists: false
                },
                lengthy_videos: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['lengthy_videos'] || 0)/100);
                    },
                    title: 'Lengthy videos',
                    exists: false
                },
                no_comments: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['no_comments'] || 0)/100);
                    },
                    title: 'No comments',
                    exists: false
                },
                non_alpha: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['non_alpha'] || 0)/100);
                    },
                    title: 'Non-alpha',
                    exists: false
                },
                spammy_videos: {
                    formula: function (indicators) {
                        return shared_average * ((indicators['spammy_videos'] || 0)/100);
                    },
                    title: 'Spammy videos',
                    exists: false
                }
            },
            spam_percentage = 0,
            total_spam_percentage = 0;

        for (var key in indicators_collection) {
            var indicator = indicators_collection[key];

            spam_percentage = 0;
            spam_percentage += indicator.formula(spam_indicators);

            console.log(indicator.title, spam_percentage);
            total_spam_percentage += spam_percentage;

            indicators_collection[key].exists = true;
            indicators_list_html += spam_list_html(indicator.title, spam_percentage, shared_average);
        }

        if (!!indicators_list_html) {
            $('#indicators_list').html(indicators_list_html);
        }

        $('#total_spam_per').val(total_spam_percentage.toFixed(0) + '%').trigger('change');
    }
}

function process_cmsChanges (data) {
    var cms_changes_list_html = '';
    if (data && data.cms_changes && data.spam_indicators) {
        console.log('data', data);
        data.cms_changes.forEach(function (cms) {
            cms_changes_list_html += cms_changes_html(cms, data.spam_indicators);
        });
    }

    if (!!cms_changes_list_html) {
        $('#cms_changes_list tbody').html(cms_changes_list_html);
    }
}

/* HTML PROCESSING FUNCTIONS */

function spam_list_html (name, percentage, shared_average) {
    percentage = parseInt(percentage).toFixed(5);

    return '<li class="collection-item">'+
        '<div class="row">'+
            '<div class="col s9">'+
                '<span class="flow-text">' + name + ' &nbsp;-&nbsp; ' + percentage + '%</span>'+
            '</div>'+
            '<div class="col s3">'+
                (percentage >= (shared_average/2) ? '<a href="#!" class="secondary-content"><i class="material-icons">done</i></a>' : '&nbsp;')+
            '</div>'+
        '</div>'+
    '</li>';
}

function cms_changes_html (cms_changes, indicators) {
    return '<tr>'+
        '<td><span>'+ cms_changes.insert_date +'</span></td>'+
        '<td><span>'+ indicators.title +'</span></td>'+
        '<td><span>'+ cms_changes.action +'</span></td>'+
        '<td><span>'+ ((!cms_changes.note || cms_changes.note === 'null') ? ' &nbsp;&nbsp;&nbsp;- ' : cms_changes.note) +'</span></td>'+
    '</tr>';
}

/* obvious */

function start () {
    $('#search_channel').submit(function(event) {
        get_channel($('#search_channel input').val());
        event.preventDefault();
    });

    $(function() {
        $(".dial").knob({
            'readOnly': true,
            'width': 320,
            'height': 320,
            'inputColor': '#9e9e9e',
            'thickness': 0.4,
            'fgColor': '#d32f2f',
            'fontWeight': 'normal',
            'format' : function (value) {
                return value + '% SPAM';
            },
            'draw': function() {
                $(this.i).css('font-size', '22pt');
            }
        });
    });
}


// helpers

function variable_humanizer (str) {
    if (typeof str === 'string') {
        str = str.toLowerCase().replace(/\b[a-z](?=[a-z]{2})/g, function(letter) {
            return letter.toUpperCase(); 
        });

        str = str.replace(/_/g, " ");
    }

    return str;
}

start();

})();

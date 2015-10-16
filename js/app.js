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

var supertemp_perfect = {
    banner: "https://yt3.ggpht.com/-Z0ZLh8GdWuU/Vfd6IulYLlI/AAAAAAAAASY/KGBE2M1CVBc/w1060-fcrop64=1,00005a57ffffa5a8-nd/,Freedom%2521_YT_Banner_Rev_2560x1440_9-13-15.png",
    burst_uploads: 100,
    channel_id: "UCGUBZrH31AkJK-_JZxMLOKQ",
    cms: "anytv",
    copied_channel: 1,
    copied_videos: 50,
    download_links: 100,
    earnings: 0,
    earnings_last_30_days: 5000,
    earnings_last_90_days: 11231230,
    full_episodes: 100,
    has_custom_avatar: 0,
    has_custom_banner: 0,
    inactive: 1,
    legal_phrases: 100,
    lengthy_videos: 100,
    no_comments: 100,
    non_alpha: 100,
    spammy_videos: 100,
    subscribers: 0,
    title: "Freedom!",
    user_has_closed_channel: 1,
    videos: 0
};

var supertemp_copyshitlang = {
    banner: "https://yt3.ggpht.com/-Z0ZLh8GdWuU/Vfd6IulYLlI/AAAAAAAAASY/KGBE2M1CVBc/w1060-fcrop64=1,00005a57ffffa5a8-nd/,Freedom%2521_YT_Banner_Rev_2560x1440_9-13-15.png",
    burst_uploads: 0,
    channel_id: "UCGUBZrH31AkJK-_JZxMLOKQ",
    cms: "anytv",
    copied_channel: 1,
    copied_videos: 50,
    download_links: 0,
    earnings: 456849856,
    earnings_last_30_days: 5000,
    earnings_last_90_days: 5000,
    full_episodes: 0,
    has_custom_avatar: 1,
    has_custom_banner: 1,
    inactive: 0,
    legal_phrases: 0,
    lengthy_videos: 0,
    no_comments: 0,
    non_alpha: 0,
    spammy_videos: 0,
    subscribers: 1123123,
    title: "Freedom!",
    user_has_closed_channel: 0,
    videos: 1273234
};

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
                // process_indicators(data.spam_indicators);
                process_indicators(supertemp_copyshitlang);
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
            indicators_collection = {
                no_earnings: {
                    intensity: 20,
                    formula: function (indicators, intensity) {
                        return !indicators['earnings'] ? 100 * intensity: 0;
                    },
                    title: 'No earnings'
                },
                revenue_dropoff: {
                    intensity: 10,
                    formula: function (indicators, intensity) {
                        if (indicators['earnings_last_30_days'] && indicators['earnings_last_90_days']) {
                            return ((indicators['earnings_last_90_days'] / 3) - indicators['earnings_last_30_days']) > 100 ? 100 * intensity : 0;
                        }

                        return 0;
                    },
                    title: 'Sudden revenue drop-off'
                },
                copycat_channel: {
                    intensity: 60,
                    taguro_intensity: true,
                    formula: function (indicators, intensity) {
                        if (indicators['copied_channel']) {
                            return (indicators['copied_videos'] >= 50 ? 99999999999999999999 : indicators['copied_videos']) * intensity;
                        }

                        return 0;
                    },
                    title: 'Copycat channel'
                },
                no_banner_and_avatar: {
                    intensity: 10,
                    formula: function (indicators, intensity) {
                        return (100 -((indicators['has_custom_banner'] * 50) + (indicators['has_custom_avatar'] * 50))) * intensity
                    },
                    title: 'No channel banner or icon'
                },
                has_ccby: {
                    intensity: 20,
                    formula: function (indicators, intensity) {
                        return indicators['user_has_closed_channel'] * 100 * intensity;
                    },
                    title: 'Has channel closed by YouTube'
                },
                inactive_channel: {
                    intensity: 5,
                    formula: function (indicators, intensity) {
                        return indicators['inactive'] * 100 * intensity;
                    },
                    title: 'Inactive channel'
                },
                burst_uploads: {
                    intensity: 50,
                    formula: function (indicators, intensity) {
                        return indicators['burst_uploads'] * intensity;
                    },
                    title: 'Burst uploads'
                },
                download_links: {
                    intensity: 30,
                    formula: function (indicators, intensity) {
                        return indicators['download_links'] * intensity;
                    },
                    title: 'Download links'
                },
                full_episodes: {
                    intensity: 50,
                    formula: function (indicators, intensity) {
                        return indicators['full_episodes'] * intensity;
                    },
                    title: 'Full episodes'
                },
                legal_phrases: {
                    intensity: 10,
                    formula: function (indicators, intensity) {
                        return indicators['legal_phrases'] * intensity;
                    },
                    title: 'Legal phrases'
                },
                lengthy_videos: {
                    intensity: 30,
                    formula: function (indicators, intensity) {
                        return indicators['lengthy_videos'] * intensity;
                    },
                    title: 'Lengthy videos'
                },
                no_comments: {
                    intensity: 10,
                    formula: function (indicators, intensity) {
                        return indicators['no_comments'] * intensity;
                    },
                    title: 'No comments'
                },
                non_alpha: {
                    intensity: 30,
                    formula: function (indicators, intensity) {
                        return indicators['non_alpha'] * intensity;
                    },
                    title: 'Non-alpha'
                },
                spammy_videos: {
                    intensity: 20,
                    formula: function (indicators, intensity) {
                        return indicators['spammy_videos'] * intensity;
                    },
                    title: 'Spammy videos'
                }
            },
            spam_percentage = 0,
            total_spam_percentage = 0,
            total_points = 0, total_intensity = 0;

        for (var key in indicators_collection) {
            total_intensity += indicators_collection[key].intensity || 0;
            console.log(indicators_collection[key].title, indicators_collection[key].intensity);
        }

        console.log('------------- percentage --------------');

        for (var key in indicators_collection) {
            var ndctr = indicators_collection[key];

            spam_percentage = 0;

            var raw_point = ndctr.formula(spam_indicators, ndctr.intensity);
            var sub_total_point = raw_point / total_intensity;
            var row_percentage = raw_point / ndctr.intensity;

            console.log(ndctr.title, row_percentage, sub_total_point);

            total_spam_percentage += sub_total_point;

            row_percentage = row_percentage > 100 ? 100 : row_percentage;

            indicators_list_html += spam_list_html(ndctr.title, row_percentage, ndctr.taguro_intensity);
        }

        console.log('total_spam_percentage',total_spam_percentage);

        if (!!indicators_list_html) {
            $('#indicators_list').html(indicators_list_html);
        }

        total_spam_percentage = total_spam_percentage > 100 ? 100 : total_spam_percentage;

        $('#total_spam_per').val(total_spam_percentage.toFixed(0) + '%').trigger('change');

        $('.tooltipped').tooltip({delay: 50});
    }
}

function process_cmsChanges (data) {
    var cms_changes_list_html = '';
    if (data && data.cms_changes && data.spam_indicators) {
        data.cms_changes.forEach(function (cms) {
            cms_changes_list_html += cms_changes_html(cms, data.spam_indicators);
        });
    }

    if (!!cms_changes_list_html) {
        $('#cms_changes_list tbody').html(cms_changes_list_html);
    }
    else {
         $('#cms_changes_list tbody').html('<tr><td colspan="4" class="center-align">Empty</td></tr>');
    }
}

/* HTML PROCESSING FUNCTIONS */

function spam_list_html (name, percentage, taguro) {
    return '<li class="collection-item">'+
        '<div class="row">'+
            '<div class="col s9">'+
                '<span class="flow-text'+ (taguro ? ' tooltipped taguro" data-position="top" data-delay="50" data-tooltip="This is a taguro intensity, if 50% or above, you GG."':'') +'">' + name + ' &nbsp;-&nbsp; ' + percentage.toFixed(5) + '%</span>'+
            '</div>'+
            '<div class="col s3">'+
                (percentage >= 50 ? '<a href="#!"  class="secondary-content"><i class="material-icons">done</i></a>' : '&nbsp;')+
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
